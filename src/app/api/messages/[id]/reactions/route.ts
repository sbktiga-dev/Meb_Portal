export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { emoji } = body;

    if (!emoji || typeof emoji !== 'string') {
      return NextResponse.json({ error: 'Укажите эмодзи' }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id: params.id },
    });

    if (!message) {
      return NextResponse.json({ error: 'Сообщение не найдено' }, { status: 404 });
    }

    const reactions = JSON.parse(message.reactions || '{}');

    if (!reactions[emoji]) {
      reactions[emoji] = [];
    }

    const userIndex = reactions[emoji].indexOf(user.id);
    if (userIndex > -1) {
      reactions[emoji].splice(userIndex, 1);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      reactions[emoji].push(user.id);
    }

    await prisma.message.update({
      where: { id: params.id },
      data: { reactions: JSON.stringify(reactions) },
    });

    return NextResponse.json({ reactions });
  } catch (e) {
    console.error('Reaction error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
