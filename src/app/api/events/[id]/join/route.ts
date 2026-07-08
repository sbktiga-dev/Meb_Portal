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

    const participantCount = await prisma.eventParticipant.count({ where: { eventId: params.id } });

    const existing = await prisma.eventParticipant.findUnique({
      where: { userId_eventId: { userId: user.id, eventId: params.id } },
    });

    if (existing) {
      await prisma.eventParticipant.delete({
        where: { userId_eventId: { userId: user.id, eventId: params.id } },
      });
      const newCount = await prisma.eventParticipant.count({ where: { eventId: params.id } });
      return NextResponse.json({ joined: false, participants: newCount });
    }

    if (event.maxParticipants) {
      const maxP = event.maxParticipants;
      const result = await prisma.$transaction(async (tx) => {
        const count = await tx.eventParticipant.count({ where: { eventId: params.id } });
        if (count >= maxP) {
          return { success: false, newCount: count };
        }
        await tx.eventParticipant.create({
          data: { userId: user.id, eventId: params.id, status: 'going' },
        });
        const newCount = await tx.eventParticipant.count({ where: { eventId: params.id } });
        return { success: true, newCount };
      });
      if (!result.success) {
        return NextResponse.json({ error: 'Достигнут лимит участников' }, { status: 400 });
      }
      if (user.id !== event.organizerId) {
        await prisma.notification.create({
          data: {
            type: 'event_join',
            message: `${user.name || 'Пользователь'} записался на мероприятие`,
            link: `/events/${params.id}`,
            userId: event.organizerId,
            fromUserId: user.id,
          },
        });
      }
      return NextResponse.json({ joined: true, participants: result.newCount });
    }

    await prisma.eventParticipant.create({
      data: { userId: user.id, eventId: params.id, status: 'going' },
    });

    if (user.id !== event.organizerId) {
      await prisma.notification.create({
        data: {
          type: 'event_join',
          message: `${user.name || 'Пользователь'} записался на мероприятие`,
          link: `/events/${params.id}`,
          userId: event.organizerId,
          fromUserId: user.id,
        },
      });
    }

    const newCount = await prisma.eventParticipant.count({ where: { eventId: params.id } });
    return NextResponse.json({ joined: true, participants: newCount });
  } catch (e) {
    console.error('Event join error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
