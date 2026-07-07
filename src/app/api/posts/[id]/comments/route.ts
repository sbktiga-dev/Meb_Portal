export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { sanitizeInput } from '@/lib/validation';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';
import { sendPushToUser } from '@/lib/push';

const MAX_COMMENT_LENGTH = 2000;

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
    const { allowed, resetAt } = rateLimit(`comment:${user.id}:${ip}`, RATE_LIMITS.comment.maxRequests, RATE_LIMITS.comment.windowMs);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много комментариев. Попробуйте через минуту.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    const postExists = await prisma.post.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!postExists) {
      return NextResponse.json({ error: 'Пост не найден' }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Комментарий не может быть пустым' }, { status: 400 });
    }

    const sanitized = sanitizeInput(content.trim());
    if (sanitized.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json({ error: `Комментарий не может превышать ${MAX_COMMENT_LENGTH} символов` }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: { content: sanitized, authorId: user.id, postId: params.id },
      include: { author: { select: { id: true, name: true } } },
    });

    const post = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true, title: true } });
    if (post && post.authorId !== user.id) {
      const userName = user.name || user.email;
      await prisma.notification.create({
        data: {
          type: 'comment',
          message: `${userName} прокомментировал ваш пост «${post.title}»`,
          userId: post.authorId,
          fromUserId: user.id,
          postId: params.id,
          link: `/feed/${params.id}`,
        },
      });
      sendPushToUser(post.authorId, {
        title: 'Новый комментарий',
        body: `${userName} прокомментировал ваш пост`,
        url: `/feed/${params.id}`,
      }).catch(() => {});
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (e) {
    console.error('Comment error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
