import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
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

    const { newEmail } = await req.json();
    if (!newEmail || !newEmail.includes('@')) {
      return NextResponse.json({ error: 'Введите корректный email' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (newEmail === user.email) {
      return NextResponse.json({ error: 'Это уже ваш текущий email' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) {
      return NextResponse.json({ error: 'Этот email уже занят' }, { status: 400 });
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 минут
    // Store code:email:expiresAt in the field so PUT can verify
    await prisma.user.update({
      where: { id: user.id },
      data: { emailChangeCode: `${code}:${newEmail}:${expiresAt}` },
    });

    await sendEmail({
      to: newEmail,
      subject: 'Код подтверждения смены email — МебПортал',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Код подтверждения</h2>
          <p>Ваш код для смены email:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: #f8f7f4; border-radius: 8px; margin: 20px 0;">${code}</div>
          <p style="color: #999; font-size: 12px;">Код действителен 15 минут. Если вы не запрашивали смену email, проигнорируйте это письмо.</p>
        </div>
      `,
    }).catch(() => false);

    return NextResponse.json({ message: 'Код отправлен' });
  } catch (error) {
    console.error('Change email error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    const { code } = await req.json();
    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Введите 6-значный код' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Format is "code:email:expiresAt"
    const parts = (user.emailChangeCode || '').split(':');
    const storedCode = parts[0];
    const pendingEmail = parts.slice(1, -1).join(':');
    const expiresAt = parseInt(parts[parts.length - 1]) || 0;

    if (storedCode !== code || !pendingEmail) {
      return NextResponse.json({ error: 'Неверный или просроченный код' }, { status: 400 });
    }

    if (Date.now() > expiresAt) {
      await prisma.user.update({ where: { id: user.id }, data: { emailChangeCode: null } });
      return NextResponse.json({ error: 'Код истёк. Запросите новый.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: pendingEmail } });
    if (existing) {
      return NextResponse.json({ error: 'Этот email уже занят' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { email: pendingEmail, emailChangeCode: null, emailVerified: true },
    });

    return NextResponse.json({ message: 'Email успешно изменён', email: pendingEmail });
  } catch (error) {
    console.error('Change email confirm error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
