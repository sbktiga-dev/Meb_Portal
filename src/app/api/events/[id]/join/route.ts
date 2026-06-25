export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    const existing = await prisma.eventParticipant.findUnique({
      where: { userId_eventId: { userId: user.id, eventId: params.id } },
    });

    if (existing) {
      await prisma.eventParticipant.delete({
        where: { userId_eventId: { userId: user.id, eventId: params.id } },
      });
      return NextResponse.json({ joined: false });
    }

    if (event.maxParticipants) {
      const maxP = event.maxParticipants;
      const result = await prisma.$transaction(async (tx) => {
        const count = await tx.eventParticipant.count({ where: { eventId: params.id } });
        if (count >= maxP) {
          return null;
        }
        return tx.eventParticipant.create({
          data: { userId: user.id, eventId: params.id, status: 'going' },
        });
      });
      if (!result) {
        return NextResponse.json({ error: 'Достигнут лимит участников' }, { status: 400 });
      }
      return NextResponse.json({ joined: true });
    }

    await prisma.eventParticipant.create({
      data: { userId: user.id, eventId: params.id, status: 'going' },
    });

    return NextResponse.json({ joined: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
