export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        organizer: { select: { id: true, name: true, avatar: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: { select: { participants: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Событие не найдено' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
