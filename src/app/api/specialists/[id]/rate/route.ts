export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { score, comment } = body;

    if (!score || score < 1 || score > 5) {
      return NextResponse.json({ error: 'Оценка должна быть от 1 до 5' }, { status: 400 });
    }

    const specialist = await prisma.specialist.findUnique({
      where: { id: params.id },
    });
    if (!specialist) {
      return NextResponse.json({ error: 'Специалист не найден' }, { status: 404 });
    }

    const existing = await prisma.rating.findFirst({
      where: { userId: payload.userId, specialistId: params.id },
    });

    if (existing) {
      await prisma.rating.update({
        where: { id: existing.id },
        data: { score, comment: comment || null },
      });
    } else {
      await prisma.rating.create({
        data: {
          score,
          comment: comment || null,
          userId: payload.userId,
          specialistId: params.id,
        },
      });
    }

    const avgResult = await prisma.rating.aggregate({
      where: { specialistId: params.id },
      _avg: { score: true },
    });

    const avgRating = avgResult._avg.score || 0;

    await prisma.specialist.update({
      where: { id: params.id },
      data: { rating: Math.round(avgRating * 10) / 10 },
    });

    return NextResponse.json({ success: true, rating: Math.round(avgRating * 10) / 10 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
