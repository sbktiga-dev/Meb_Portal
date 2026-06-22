import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

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
        include: { _count: { select: { products: true } } },
        orderBy,
      }),
      prisma.supplier.count({ where }),
    ]);

    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
