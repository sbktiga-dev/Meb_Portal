export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { sendPushToUsers } from '@/lib/push';

export async function GET(
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

    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        userId_conversationId: { userId: user.id, conversationId: params.id },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: params.id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.message.count({ where: { conversationId: params.id } }),
    ]);

    await prisma.conversationParticipant.updateMany({
      where: { userId: user.id, conversationId: params.id },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json({
      messages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('Error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

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

    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        userId_conversationId: { userId: user.id, conversationId: params.id },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const ip = getClientIp(request as Parameters<typeof getClientIp>[0]);
    const { allowed, resetAt } = rateLimit(`msg:${user.id}`, 30, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много сообщений. Подождите минуту.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Сообщение не может быть пустым' }, { status: 400 });
    }

    if (content.trim().length > 5000) {
      return NextResponse.json({ error: 'Сообщение не может превышать 5000 символов' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        authorId: user.id,
        conversationId: params.id,
      },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });

    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId: params.id, userId: { not: user.id } },
      select: { userId: true },
    });
    if (otherParticipants.length > 0) {
      // Create in-app notifications
      await prisma.notification.createMany({
        data: otherParticipants.map(p => ({
          type: 'message',
          message: `${user.name || 'Пользователь'} отправил вам сообщение`,
          userId: p.userId,
          fromUserId: user.id,
          link: `/dashboard/messages/${params.id}`,
        })),
      });

      // Send push notifications
      sendPushToUsers(
        otherParticipants.map(p => p.userId),
        { title: 'Новое сообщение', body: `${user.name || 'Пользователь'} написал вам`, url: `/dashboard/messages/${params.id}` }
      ).catch(() => {});
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    console.error('Error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
