export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { getUserFromToken } = await import('@/lib/auth');
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const user = await getUserFromToken(authHeader.split(' ')[1]);
      if (user) userId = user.id;
    }

    const item = await prisma.portfolioItem.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!item) {
      return NextResponse.json({ error: 'Работа не найдена' }, { status: 404 });
    }

    if (!item.isPublished && item.userId !== userId) {
      return NextResponse.json({ error: 'Работа не найдена' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (e) {
    console.error('Error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { getUserFromToken } = await import('@/lib/auth');
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const item = await prisma.portfolioItem.findUnique({ where: { id: params.id } });
    if (!item) {
      return NextResponse.json({ error: 'Работа не найдена' }, { status: 404 });
    }
    if (item.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, images, category, tags } = body;

    const updated = await prisma.portfolioItem.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(images !== undefined && { images: JSON.stringify(images) }),
        ...(category !== undefined && { category: category || null }),
        ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ item: updated });
  } catch (e) {
    console.error('Error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { getUserFromToken } = await import('@/lib/auth');
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const item = await prisma.portfolioItem.findUnique({ where: { id: params.id } });
    if (!item) {
      return NextResponse.json({ error: 'Работа не найдена' }, { status: 404 });
    }
    if (item.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    await prisma.portfolioItem.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
