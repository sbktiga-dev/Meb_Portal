export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { sanitizeInput } from '@/lib/validation';

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

    const body = await request.json();
    const { disputeText, disputeImages } = body;

    if (!disputeText?.trim()) {
      return NextResponse.json({ error: 'Укажите причину оспаривания' }, { status: 400 });
    }

    const sanitizedText = sanitizeInput(disputeText.trim());
    const imagesJson = JSON.stringify(disputeImages || []);

    const updated = await prisma.userProfileReview.update({
      where: { id: params.reviewId },
      data: {
        status: 'disputed',
        disputeText: sanitizedText,
        disputeImages: imagesJson,
        disputedAt: new Date(),
        respondedAt: new Date(),
      },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    return NextResponse.json({ review: updated });
  } catch (e) {
    console.error('Review dispute error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
