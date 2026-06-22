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

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { userId: user.id };
    if (itemType) where.itemType = itemType;

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.favorite.count({ where }),
    ]);

    const enriched = await Promise.all(
      favorites.map(async (fav) => {
        let item = null;
        if (fav.itemType === 'image') {
          item = await prisma.image.findUnique({ where: { id: fav.itemId } });
        } else if (fav.itemType === 'document') {
          item = await prisma.document.findUnique({ where: { id: fav.itemId } });
        }
        return { ...fav, item };
      })
    );

    return NextResponse.json({
      favorites: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
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
    const { itemType, itemId } = body;

    if (!itemType || !itemId) {
      return NextResponse.json({ error: 'itemType и itemId обязательны' }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_itemType_itemId: { userId: user.id, itemType, itemId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    await prisma.favorite.create({
      data: { userId: user.id, itemType, itemId },
    });

    return NextResponse.json({ favorited: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
