export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { sanitizeInput } from '@/lib/validation';

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
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
