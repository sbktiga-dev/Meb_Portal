import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    if (!idsParam) {
      return NextResponse.json({ error: 'ids parameter required' }, { status: 400 });
    }

    const ids = idsParam.split(',').filter(Boolean);
    if (ids.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        company: { select: { id: true, name: true } },
        supplier: { select: { id: true, companyName: true } },
        _count: { select: { reviews: true } },
      },
    });

    const ratings = await prisma.productReview.groupBy({
      by: ['productId'],
      where: { productId: { in: ids } },
      _avg: { score: true },
    });
    const ratingMap = new Map(ratings.map(r => [r.productId, r._avg.score || 0]));

    const productsWithRating = products.map(p => ({
      ...p,
      avgRating: ratingMap.get(p.id) || 0,
    }));

    return NextResponse.json({ products: productsWithRating });
  } catch (e) {
    console.error('Products batch GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
