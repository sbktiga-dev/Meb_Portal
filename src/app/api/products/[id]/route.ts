export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { getUserFromToken } = await import('@/lib/auth');
        const u = await getUserFromToken(authHeader.split(' ')[1]);
        if (u) userId = u.id;
      } catch (error) { console.error('Auth error:', error); }
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        company: { select: { id: true, name: true, logo: true, phone: true, users: { select: { id: true } } } },
        supplier: { select: { id: true, companyName: true, logo: true, phone: true, users: { select: { id: true } } } },
        reviews: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    // Hide unpublished products from non-owners
    if (!product.isPublished) {
      const isOwner = product.company?.users?.some(u => u.id === userId) ||
                      product.supplier?.users?.some(u => u.id === userId);
      if (!isOwner) {
        return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
      }
    }

    const agg = await prisma.productReview.aggregate({
      where: { productId: params.id },
      _avg: { score: true },
    });

    return NextResponse.json({ product: { ...product, avgRating: agg._avg.score || 0 } });
  } catch (e) {
    console.error('Product GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
