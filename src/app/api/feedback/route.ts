import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { type, message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Сообщение обязательно' }, { status: 400 });
    }
    if (!['bug', 'feature'].includes(type)) {
      return NextResponse.json({ error: 'Невалидный тип' }, { status: 400 });
    }

    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.split(' ')[1]);
      if (payload) userId = payload.userId;
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    await prisma.feedback.create({
      data: { type, message: message.trim(), userId, ip },
    });

    return NextResponse.json({ message: 'Спасибо за обратную связь!' });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
