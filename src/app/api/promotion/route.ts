export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

const DURATION_DAYS: Record<number, number> = { 7: 7, 14: 14, 30: 30 };

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const promotions = await prisma.promotion.findMany({
      where: { userId: user.id },
      include: { post: { select: { id: true, title: true, category: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ promotions });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const body = await req.json();
    const { postId, duration } = body;

    if (!postId || !duration || !DURATION_DAYS[duration]) {
      return NextResponse.json({ error: 'postId и duration (7/14/30) обязательны' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.authorId !== user.id) {
      return NextResponse.json({ error: 'Пост не найден или не принадлежит вам' }, { status: 404 });
    }

    const existing = await prisma.promotion.findFirst({
      where: { postId, status: { in: ['pending', 'active'] } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Для этого поста уже есть активная заявка' }, { status: 409 });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + DURATION_DAYS[duration]);

    const promotion = await prisma.promotion.create({
      data: {
        postId,
        userId: user.id,
        startDate: now,
        endDate,
        status: 'pending',
      },
      include: { post: { select: { id: true, title: true } } },
    });

    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
