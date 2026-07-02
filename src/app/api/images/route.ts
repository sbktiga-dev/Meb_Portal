import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const style = searchParams.get('style');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const sort = searchParams.get('sort') || 'newest';

    const where: Record<string, unknown> = {};
    if (style) where.style = style;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, Date>).lte = to;
      }
    }

    const orderBy = sort === 'popular'
      ? { downloads: 'desc' as const }
      : sort === 'title'
        ? { title: 'asc' as const }
        : { createdAt: 'desc' as const };

    const [images, total] = await Promise.all([
      prisma.image.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      prisma.image.count({ where }),
    ]);

    const res = NextResponse.json({
      images,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    if (!style && !category && !search) {
      res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    }
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
