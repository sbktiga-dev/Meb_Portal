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

    const product = await prisma.product.findUnique({ where: { id: params.id } });
    if (!product) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    const existing = await prisma.productReview.findUnique({
      where: { userId_productId: { userId: user.id, productId: params.id } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Вы уже оставили отзыв' }, { status: 400 });
    }

    const body = await request.json();
    const { score, comment } = body;

    if (!score || score < 1 || score > 5) {
      return NextResponse.json({ error: 'Оценка от 1 до 5' }, { status: 400 });
    }

    const review = await prisma.productReview.create({
      data: {
        score: Math.round(score),
        comment: comment?.trim() || null,
        userId: user.id,
        productId: params.id,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
