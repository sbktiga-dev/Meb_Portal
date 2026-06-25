export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const [posts, total] = await Promise.all([
      prisma.groupPost.findMany({
        where: { groupId: params.id },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.groupPost.count({ where: { groupId: params.id } }),
    ]);

    return NextResponse.json({
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

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

    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: params.id } },
    });

    if (!member) {
      return NextResponse.json({ error: 'Вы не участник группы' }, { status: 403 });
    }

    const body = await request.json();
    const { content, images } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Содержание обязательно' }, { status: 400 });
    }

    const post = await prisma.groupPost.create({
      data: {
        content: content.trim(),
        images: images ? JSON.stringify(images) : '[]',
        authorId: user.id,
        groupId: params.id,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
