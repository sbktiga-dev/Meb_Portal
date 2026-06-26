export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

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

    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId: user.id, postId: params.id } },
    });

    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
      const post = await prisma.post.findUnique({ where: { id: params.id }, select: { likes: true } });
      const newLikes = Math.max((post?.likes || 1) - 1, 0);
      await prisma.post.update({ where: { id: params.id }, data: { likes: newLikes } });
      return NextResponse.json({ liked: false, likes: newLikes });
    }

    await prisma.postLike.create({ data: { userId: user.id, postId: params.id } });
    await prisma.post.update({ where: { id: params.id }, data: { likes: { increment: 1 } } });

    const post = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true, title: true, likes: true } });
    if (post && post.authorId !== user.id) {
      const userName = user.name || user.email;
      await prisma.notification.create({
        data: {
          type: 'like',
          message: `${userName} лайкнул ваш пост «${post.title}»`,
          userId: post.authorId,
          fromUserId: user.id,
          postId: params.id,
          link: `/feed/${params.id}`,
        },
      });
    }

    return NextResponse.json({ liked: true, likes: post?.likes || 0 });
  } catch (e) {
    console.error('Like error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
