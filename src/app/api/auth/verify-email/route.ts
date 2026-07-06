import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { sendEmail, verificationEmailHtml } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Невалидный токен' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email уже подтверждён' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;

    const sent = await sendEmail({
      to: user.email,
      subject: 'Подтверждение email — МебПортал',
      html: verificationEmailHtml(user.name || 'Пользователь', verificationUrl),
    });

    if (sent) {
      return NextResponse.json({ message: 'Письмо с подтверждением отправлено' });
    } else {
      return NextResponse.json({ message: 'Письмо отправлено', verificationUrl });
    }
  } catch (error) {
    console.error('Send verification error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
