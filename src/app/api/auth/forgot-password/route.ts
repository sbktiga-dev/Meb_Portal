import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp, checkDualRateLimit } from '@/lib/rateLimit';
import { sendEmail, passwordResetEmailHtml } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const { email } = body;

    const { allowed, resetAt } = checkDualRateLimit(ip, email, 'forgot-password', 3, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Попробуйте через минуту.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({
        message: 'Если аккаунт с таким email существует, письмо с инструкциями отправлено',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Send reset email
    await sendEmail({
      to: user.email,
      subject: 'Сброс пароля — МебПортал',
      html: passwordResetEmailHtml(user.name || 'Пользователь', resetUrl),
    }).catch(() => false);

    return NextResponse.json({
      message: 'Если аккаунт с таким email существует, письмо с инструкциями отправлено',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
