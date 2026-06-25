import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

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

    const bookmark = await prisma.bookmark.findUnique({ where: { id: params.id } });
    if (!bookmark || bookmark.userId !== user.id) {
      return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
    }

    const body = await request.json();
    const { itemType, itemId } = body;

    if (!itemType || !itemId) {
      return NextResponse.json({ error: 'itemType и itemId обязательны' }, { status: 400 });
    }

    if (!['image', 'document', 'post', 'product'].includes(itemType)) {
      return NextResponse.json({ error: 'Недопустимый тип элемента' }, { status: 400 });
    }

    const existing = await prisma.bookmarkItem.findUnique({
      where: { bookmarkId_itemType_itemId: { bookmarkId: params.id, itemType, itemId } },
    });

    if (existing) {
      await prisma.bookmarkItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ added: false });
    }

    await prisma.bookmarkItem.create({
      data: { bookmarkId: params.id, itemType, itemId },
    });

    return NextResponse.json({ added: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
