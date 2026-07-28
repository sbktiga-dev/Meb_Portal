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
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          replyTo: {
            include: { author: { select: { id: true, name: true, avatar: true } } },
          },
        },
      }),
      prisma.message.count({ where: { conversationId: params.id } }),
    ]);

    // Update user's lastActiveAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

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
    const { content, attachments, replyToId } = body;

    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: 'Сообщение не может быть пустым' }, { status: 400 });
    }

    if (content && content.trim().length > 5000) {
      return NextResponse.json({ error: 'Сообщение не может превышать 5000 символов' }, { status: 400 });
    }

    if (attachments && attachments.length > 5) {
      return NextResponse.json({ error: 'Максимум 5 вложений' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content: content?.trim() || '',
        attachments: attachments ? JSON.stringify(attachments) : '[]',
        replyToId: replyToId || null,
        authorId: user.id,
        conversationId: params.id,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        replyTo: {
          include: { author: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    // Update user's lastActiveAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
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

      // Admin alert
      prisma.adminAlert.create({ data: { type: 'new_message', title: `Новое сообщение от ${user.name || 'пользователя'}` } }).catch(() => {});
    }

    // AmoCRM integration: create deal on first message from CLIENT
    if (user.role === 'CLIENT') {
      try {
        const { findOrCreateContact, createDeal, addNoteToLead } = await import('@/lib/amoCRM');
        const msgCount = await prisma.message.count({
          where: { authorId: user.id, conversationId: params.id },
        });
        if (msgCount <= 1) {
          const client = await prisma.user.findUnique({
            where: { id: user.id },
            select: { phone: true, name: true },
          });
          if (client?.phone) {
            const contactId = await findOrCreateContact(client.phone, client.name || 'Клиент');
            if (contactId) {
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mebportal.online';
              const dealId = await createDeal(contactId, client.name || 'Клиент', `${appUrl}/profile/${user.id}`);
              if (dealId && content?.trim()) {
                addNoteToLead(dealId, content.trim()).catch(() => {});
              }
            }
          }
        } else {
          // Add subsequent messages as notes to existing deal
          const { findOrCreateContact, addNoteToLead } = await import('@/lib/amoCRM');
          if (content?.trim()) {
            const client = await prisma.user.findUnique({
              where: { id: user.id },
              select: { phone: true, name: true },
            });
            if (client?.phone) {
              const contactId = await findOrCreateContact(client.phone, client.name || 'Клиент');
              if (contactId) {
                const integration = await prisma.integration.findUnique({ where: { type: 'amocrm' } });
                if (integration?.enabled) {
                  // Find deal by contact (simplified - in production you'd store dealId)
                  addNoteToLead(contactId, content.trim()).catch(() => {});
                }
              }
            }
          }
        }
      } catch (amoErr) {
        console.error('AmoCRM integration error:', amoErr);
      }
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (e) {
    console.error('Error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
