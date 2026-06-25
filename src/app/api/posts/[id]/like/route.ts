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

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.postLike.findUnique({
        where: { userId_postId: { userId: user.id, postId: params.id } },
      });

      if (existing) {
        await tx.postLike.delete({ where: { id: existing.id } });
        await tx.$executeRaw`UPDATE Post SET likes = GREATEST(likes - 1, 0) WHERE id = ${params.id}`;
        return { liked: false };
      }

      await tx.postLike.create({ data: { userId: user.id, postId: params.id } });
      await tx.post.update({ where: { id: params.id }, data: { likes: { increment: 1 } } });

      const post = await tx.post.findUnique({ where: { id: params.id }, select: { authorId: true, title: true } });
      if (post && post.authorId !== user.id) {
        const userName = user.name || user.email;
        await tx.notification.create({
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

      return { liked: true };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
