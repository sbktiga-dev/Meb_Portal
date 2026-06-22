import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        company: { select: { id: true, name: true, logo: true, phone: true, email: true } },
        supplier: { select: { id: true, companyName: true, logo: true, phone: true, email: true } },
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

    const agg = await prisma.productReview.aggregate({
      where: { productId: params.id },
      _avg: { score: true },
    });

    return NextResponse.json({ product: { ...product, avgRating: agg._avg.score || 0 } });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
