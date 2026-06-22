import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { getUserFromToken } = await import('@/lib/auth');
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
      await prisma.post.update({ where: { id: params.id }, data: { likes: { decrement: 1 } } });
      return NextResponse.json({ liked: false });
    }

    await prisma.postLike.create({ data: { userId: user.id, postId: params.id } });
    await prisma.post.update({ where: { id: params.id }, data: { likes: { increment: 1 } } });

    const post = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true, title: true } });
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

    return NextResponse.json({ liked: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
