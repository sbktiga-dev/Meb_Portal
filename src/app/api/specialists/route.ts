import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'rating';
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where: Record<string, unknown> = { user: { isNot: null } };
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { description: { contains: search } },
      ];
    }

    const orderBy = sort === 'experience'
      ? { experience: 'desc' as const }
      : sort === 'newest'
        ? { createdAt: 'desc' as const }
        : { rating: 'desc' as const };

    const [specialists, total] = await Promise.all([
      prisma.specialist.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, name: true } } },
        orderBy,
      }),
      prisma.specialist.count({ where }),
    ]);

    return NextResponse.json({
      specialists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Specialists GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
