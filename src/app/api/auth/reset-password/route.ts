import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed, resetAt } = rateLimit(`reset-password:${ip}`, 3, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много попыток. Попробуйте через минуту.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: 'Токен и пароль обязательны' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Пароль должен быть минимум 6 символов' }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Невалидный или просроченный токен' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({ message: 'Пароль успешно изменён' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
