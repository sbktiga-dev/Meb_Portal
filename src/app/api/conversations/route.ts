import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request) {
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

    const participations = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, name: true, avatar: true, email: true } },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { author: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const conversations = participations.map((p) => ({
      ...p.conversation,
      otherUser: p.conversation.participants
        .find((pp) => pp.userId !== user.id)?.user,
      lastMessage: p.conversation.messages[0] || null,
      unread: p.lastReadAt
        ? p.conversation.messages.filter(
            (m) => m.authorId !== user.id && new Date(m.createdAt) > new Date(p.lastReadAt!)
          ).length
        : p.conversation.messages.filter((m) => m.authorId !== user.id).length,
    }));

    return NextResponse.json({ conversations });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    const { userId: targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId обязателен' }, { status: 400 });
    }

    if (user.id === targetUserId) {
      return NextResponse.json({ error: 'Нельзя создать чат с собой' }, { status: 400 });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
        },
      },
    });

    if (existing) {
      return NextResponse.json({ conversation: existing });
    }

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: user.id },
            { userId: targetUserId },
          ],
        },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
        },
      },
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
