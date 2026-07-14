export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string; reviewId: string } }
) {
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

    if (user.id !== params.id) {
      return NextResponse.json({ error: 'Нет прав' }, { status: 403 });
    }

    const review = await prisma.userProfileReview.findUnique({
      where: { id: params.reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: 'Отзыв не найден' }, { status: 404 });
    }

    if (review.targetUserId !== params.id) {
      return NextResponse.json({ error: 'Нет прав' }, { status: 403 });
    }

    if (review.status !== 'pending') {
      return NextResponse.json({ error: 'Отзыв уже обработан' }, { status: 400 });
    }

    const updated = await prisma.userProfileReview.update({
      where: { id: params.reviewId },
      data: {
        status: 'approved',
        respondedAt: new Date(),
      },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    return NextResponse.json({ review: updated });
  } catch (e) {
    console.error('Review approve error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
