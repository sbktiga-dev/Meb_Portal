import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const sort = searchParams.get('sort') || 'newest';

    const where: Record<string, unknown> = {};
    if (category) where.categories = { contains: category };
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy = sort === 'verified'
      ? { isVerified: 'desc' as const }
      : sort === 'products'
        ? { companyName: 'asc' as const }
        : { createdAt: 'desc' as const };

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { products: true } },
          users: { select: { id: true, name: true, avatar: true } },
        },
        orderBy,
      }),
      prisma.supplier.count({ where }),
    ]);

    const parsed = suppliers.map((s) => ({
      ...s,
      avatar: s.users?.[0]?.avatar || null,
      displayName: s.users?.[0]?.name || s.companyName,
      userId: s.users?.[0]?.id || null,
    }));

    const res = NextResponse.json({
      suppliers: parsed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    if (!category && !search) {
      res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    }
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const { verifyToken } = await import('@/lib/auth');
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const body = await request.json();
    const { companyName, description, categories, phone, email, website } = body;

    if (!companyName) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        companyName,
        description: description || null,
        categories: categories ? JSON.stringify(categories) : '[]',
        phone: phone || null,
        email: email || null,
        website: website || null,
      },
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
