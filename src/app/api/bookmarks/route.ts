import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request) {
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

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      include: {
        items: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookmarks });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Название не может превышать 100 символов' }, { status: 400 });
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        name: name.trim(),
        userId: user.id,
      },
      include: { items: true, _count: { select: { items: true } } },
    });

    return NextResponse.json({ bookmark }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
