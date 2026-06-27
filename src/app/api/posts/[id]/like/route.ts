export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const ip = getClientIp(request as Parameters<typeof getClientIp>[0]);
    const { allowed, resetAt } = rateLimit(`like:${user.id}:${ip}`, RATE_LIMITS.like.maxRequests, RATE_LIMITS.like.windowMs);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много лайков. Попробуйте через минуту.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId: user.id, postId: params.id } },
    });

    if (existing) {
      const result = await prisma.$transaction(async (tx) => {
        await tx.postLike.delete({ where: { id: existing.id } });
        const post = await tx.post.update({
          where: { id: params.id },
          data: { likes: { decrement: 1 } },
          select: { likes: true },
        });
        return { likes: Math.max(post.likes, 0) };
      });
      return NextResponse.json({ liked: false, likes: result.likes });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.postLike.create({ data: { userId: user.id, postId: params.id } });
      const post = await tx.post.update({
        where: { id: params.id },
        data: { likes: { increment: 1 } },
        select: { authorId: true, title: true, likes: true },
      });
      return post;
    });

    if (result.authorId !== user.id) {
      const userName = user.name || user.email;
      await prisma.notification.create({
        data: {
          type: 'like',
          message: `${userName} лайкнул ваш пост «${result.title}»`,
          userId: result.authorId,
          fromUserId: user.id,
          postId: params.id,
          link: `/feed/${params.id}`,
        },
      });
    }

    return NextResponse.json({ liked: true, likes: result.likes });
  } catch (e) {
    console.error('Like error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
