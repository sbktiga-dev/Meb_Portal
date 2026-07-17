export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
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
    const search = searchParams.get('search') || '';
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Get all conversations with participants and last message
    const conversations = await prisma.conversation.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, role: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    // Filter by search if provided
    let filtered = conversations;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = conversations.filter(conv =>
        conv.participants.some(p =>
          p.user.name?.toLowerCase().includes(searchLower) ||
          p.user.email.toLowerCase().includes(searchLower)
        )
      );
    }

    // Get total count
    const total = await prisma.conversation.count();

    // Format response
    const formatted = filtered.map(conv => ({
      id: conv.id,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      participants: conv.participants.map(p => ({
        id: p.user.id,
        name: p.user.name,
        email: p.user.email,
        avatar: p.user.avatar,
        role: p.user.role,
      })),
      lastMessage: conv.messages[0] ? {
        id: conv.messages[0].id,
        content: conv.messages[0].content,
        createdAt: conv.messages[0].createdAt,
        author: {
          id: conv.messages[0].author.id,
          name: conv.messages[0].author.name,
          avatar: conv.messages[0].author.avatar,
        },
      } : null,
      messageCount: await prisma.message.count({ where: { conversationId: conv.id } }),
    }));

    return NextResponse.json({
      conversations: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('Admin messages GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
