export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { sanitizeInput } from '@/lib/validation';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { sendPushToUsers } from '@/lib/push';

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

    const ip = getClientIp(request as Parameters<typeof getClientIp>[0]);
    const { allowed, resetAt } = rateLimit(`review:${user.id}`, 5, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много отзывов. Попробуйте через минуту.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
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

    if (typeof score !== 'number' || !Number.isInteger(score) || score < 1 || score > 5) {
      return NextResponse.json({ error: 'Оценка должна быть целым числом от 1 до 5' }, { status: 400 });
    }

    const trimmedComment = comment?.trim() || null;
    if (trimmedComment && trimmedComment.length > 2000) {
      return NextResponse.json({ error: 'Комментарий не может превышать 2000 символов' }, { status: 400 });
    }

    const sanitizedComment = trimmedComment ? sanitizeInput(trimmedComment) : null;

    const review = await prisma.productReview.create({
      data: {
        score: Math.round(score),
        comment: sanitizedComment,
        userId: user.id,
        productId: params.id,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    if (product.userId !== user.id) {
      sendPushToUsers(
        [product.userId],
        { title: 'Новый отзыв', body: `${user.name || 'Пользователь'} оставил отзыв на ваш товар`, url: `/products/${params.id}` }
      ).catch(() => {});
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (e) {
    console.error('Product review POST error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
