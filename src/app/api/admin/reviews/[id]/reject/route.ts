export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет прав' }, { status: 403 });
    }

    const review = await prisma.userProfileReview.findUnique({
      where: { id: params.id },
    });

    if (!review) {
      return NextResponse.json({ error: 'Отзыв не найден' }, { status: 404 });
    }

    if (review.status !== 'disputed') {
      return NextResponse.json({ error: 'Отзыв не в статусе спора' }, { status: 400 });
    }

    const updated = await prisma.userProfileReview.update({
      where: { id: params.id },
      data: { status: 'rejected' },
    });

    return NextResponse.json({ review: updated });
  } catch (e) {
    console.error('Admin review reject error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
