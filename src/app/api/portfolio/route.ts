import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const category = searchParams.get('category');
    const mine = searchParams.get('mine') === '1';

    const where: Record<string, unknown> = {};

    if (mine) {
      // "My portfolio" — filter by authenticated user
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
      }
      const token = authHeader.split(' ')[1];
      const user = await getUserFromToken(token);
      if (!user) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
      }
      where.userId = user.id;
    } else {
      // Public — only published
      where.isPublished = true;
    }

    if (category) where.category = category;

    const [items, total] = await Promise.all([
      prisma.portfolioItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.portfolioItem.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('Portfolio GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { title, description, images, documents, category, tags } = body;

    if (!title) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    }

    // Валидация документов
    const validDocs = Array.isArray(documents)
      ? documents.filter((doc: Record<string, unknown>) => {
          if (!doc.url || !doc.name) return false;
          const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ];
          if (doc.type && !allowedTypes.includes(doc.type as string)) return false;
          return true;
        }).slice(0, 10) // Макс 10 документов на портфолио
      : [];

    const item = await prisma.portfolioItem.create({
      data: {
        title,
        description: description || null,
        images: JSON.stringify(images || []),
        documents: JSON.stringify(validDocs),
        category: category || null,
        tags: JSON.stringify(tags || []),
        userId: user.id,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (e) {
    console.error('Portfolio POST error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
