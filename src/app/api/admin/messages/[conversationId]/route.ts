export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { conversationId: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, role: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Диалог не найден' }, { status: 404 });
    }

    // Get messages with pagination
    const messages = await prisma.message.findMany({
      where: { conversationId: params.conversationId },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit,
      include: {
        author: {
          select: { id: true, name: true, avatar: true, role: true },
        },
      },
    });

    const totalMessages = await prisma.message.count({
      where: { conversationId: params.conversationId },
    });

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        createdAt: conversation.createdAt,
        participants: conversation.participants.map(p => ({
          id: p.user.id,
          name: p.user.name,
          email: p.user.email,
          avatar: p.user.avatar,
          role: p.user.role,
        })),
      },
      messages: messages.map(m => ({
        id: m.id,
        content: m.content,
        attachments: m.attachments,
        createdAt: m.createdAt,
        author: {
          id: m.author.id,
          name: m.author.name,
          avatar: m.author.avatar,
          role: m.author.role,
        },
      })),
      pagination: {
        offset,
        limit,
        total: totalMessages,
        hasMore: offset + limit < totalMessages,
      },
    });
  } catch (e) {
    console.error('Admin conversation messages GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
