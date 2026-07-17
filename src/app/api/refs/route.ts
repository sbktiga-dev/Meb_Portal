import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { sanitizeInput } from '@/lib/validation';

const RESTRICTED_CATEGORIES = ['Размеры', 'Нормы', 'Фурнитура', 'Материалы'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // CLIENT role cannot see restricted categories
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = await getUserFromToken(token);
      if (user?.role === 'CLIENT') {
        where.category = { notIn: RESTRICTED_CATEGORIES };
      }
    }

    const [references, total] = await Promise.all([
      prisma.reference.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.reference.count({ where }),
    ]);

    const parsed = references.map((r) => {
      let content: unknown;
      try {
        content = JSON.parse(r.content as string);
      } catch {
        content = r.content;
      }
      return { ...r, content };
    });

    const res = NextResponse.json({
      references: parsed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    if (!category && !search) {
      res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    }
    return res;
  } catch (error) {
    console.error('Refs GET error:', error);
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
    if (!user || user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, content, category } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: 'Содержание обязательно' }, { status: 400 });
    }

    const reference = await prisma.reference.create({
      data: {
        title: sanitizeInput(title.trim()),
        description: description ? sanitizeInput(description.trim()) : null,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        category: category || 'Размеры',
      },
    });

    return NextResponse.json({ reference }, { status: 201 });
  } catch (error) {
    console.error('Reference create error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
