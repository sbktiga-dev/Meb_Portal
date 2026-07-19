export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { sanitizeInput } from '@/lib/validation';
import { checkProfanity, PROFANITY_WARNING } from '@/lib/profanity';

const PUBLIC_STATUSES = ['approved', 'auto_approved'];

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.userProfileReview.findMany({
        where: { targetUserId: params.id, status: { in: PUBLIC_STATUSES } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: { id: true, name: true, avatar: true, role: true },
          },
        },
      }),
      prisma.userProfileReview.count({ where: { targetUserId: params.id, status: { in: PUBLIC_STATUSES } } }),
    ]);

    const stats = await prisma.userProfileReview.aggregate({
      where: { targetUserId: params.id, status: { in: PUBLIC_STATUSES } },
      _avg: { score: true },
      _count: true,
    });

    return NextResponse.json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: { average: stats._avg.score, count: stats._count },
    });
  } catch (e) {
    console.error('Reviews GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

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

    if (user.id === params.id) {
      return NextResponse.json({ error: 'Нельзя оставить отзыв на свой профиль' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const body = await request.json();
    const { score, comment } = body;

    if (typeof score !== 'number' || !Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json({ error: 'Оценка должна быть целым числом от 1 до 5' }, { status: 400 });
    }

    const trimmedComment = comment?.trim() || null;
    if (trimmedComment && trimmedComment.length > 1000) {
      return NextResponse.json({ error: 'Комментарий не может превышать 1000 символов' }, { status: 400 });
    }

    // Проверка на нецензурную лексику
    if (trimmedComment) {
      const profanityCheck = checkProfanity(trimmedComment);
      if (profanityCheck.hasProfanity) {
        return NextResponse.json({ error: PROFANITY_WARNING }, { status: 400 });
      }
    }

    const sanitizedComment = trimmedComment ? sanitizeInput(trimmedComment) : null;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const review = await prisma.userProfileReview.create({
      data: {
        score: Math.round(score),
        comment: sanitizedComment,
        reviewerId: user.id,
        targetUserId: params.id,
        status: 'pending',
        expiresAt,
      },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    // Create notification for target user
    await prisma.notification.create({
      data: {
        type: 'review',
        message: `${user.name || 'Пользователь'} оставил вам отзыв. Одобрите или оспорьте в течение 24 часов.`,
        userId: params.id,
        fromUserId: user.id,
        link: `/profile/${params.id}`,
      },
    });

    // Admin alert
    prisma.adminAlert.create({ data: { type: 'new_review', title: `Новый отзыв от ${user.name || 'пользователя'}` } }).catch(() => {});

    return NextResponse.json({ review }, { status: 201 });
  } catch (e) {
    console.error('Reviews POST error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
