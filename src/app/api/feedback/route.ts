import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const { type, message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Сообщение обязательно' }, { status: 400 });
    }
    if (message.trim().length > 2000) {
      return NextResponse.json({ error: 'Максимум 2000 символов' }, { status: 400 });
    }
    if (!['bug', 'feature'].includes(type)) {
      return NextResponse.json({ error: 'Невалидный тип' }, { status: 400 });
    }

    const ip = getClientIp(req);
    const { allowed, resetAt } = rateLimit(`feedback:${ip}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много обращений. Попробуйте позже.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.split(' ')[1]);
      if (payload) userId = payload.userId;
    }

    await prisma.feedback.create({
      data: { type, message: message.trim().slice(0, 2000), userId, ip },
    });

    // Admin alert
    prisma.adminAlert.create({ data: { type: 'new_feedback', title: `Обратная связь: ${type}` } }).catch(() => {});

    if (userId) {
      await logActivity({ action: 'feedback_submit', userId, details: `Обратная связь: ${type}` });
    }

    return NextResponse.json({ message: 'Спасибо за обратную связь!' });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
