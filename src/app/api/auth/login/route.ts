import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { rateLimit, getClientIp, checkDualRateLimit } from '@/lib/rateLimit';
import { logActivity } from '@/lib/activity';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const { email, password } = body;

    const { allowed, resetAt } = checkDualRateLimit(ip, email, 'login', 10, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много попыток. Попробуйте через минуту.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    if (user.banned) {
      return NextResponse.json({ error: 'Ваш аккаунт заблокирован' }, { status: 403 });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logActivity({ action: 'login', userId: user.id, ip, details: `Вход: ${user.email}` });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
