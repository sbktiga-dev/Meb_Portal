export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    if (user.userId === params.id) {
      return NextResponse.json({ error: 'Нельзя удалить свой аккаунт' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    if (target.role === 'ADMIN') {
      return NextResponse.json({ error: 'Нельзя удалить администратора' }, { status: 400 });
    }

    // Delete related data in order
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { userId: params.id } }),
      prisma.notification.deleteMany({ where: { fromUserId: params.id } }),
      prisma.postLike.deleteMany({ where: { userId: params.id } }),
      prisma.comment.deleteMany({ where: { authorId: params.id } }),
      prisma.repost.deleteMany({ where: { userId: params.id } }),
      prisma.favorite.deleteMany({ where: { userId: params.id } }),
      prisma.bookmark.deleteMany({ where: { userId: params.id } }),
      prisma.download.deleteMany({ where: { userId: params.id } }),
      prisma.follow.deleteMany({ where: { followerId: params.id } }),
      prisma.follow.deleteMany({ where: { followingId: params.id } }),
      prisma.eventParticipant.deleteMany({ where: { userId: params.id } }),
      prisma.groupMember.deleteMany({ where: { userId: params.id } }),
      prisma.groupPost.deleteMany({ where: { authorId: params.id } }),
      prisma.message.deleteMany({ where: { authorId: params.id } }),
      prisma.conversationParticipant.deleteMany({ where: { userId: params.id } }),
      prisma.productReview.deleteMany({ where: { userId: params.id } }),
      prisma.rating.deleteMany({ where: { userId: params.id } }),
      prisma.userProfileReview.deleteMany({ where: { reviewerId: params.id } }),
      prisma.userProfileReview.deleteMany({ where: { targetUserId: params.id } }),
      prisma.promotion.deleteMany({ where: { userId: params.id } }),
      prisma.banner.deleteMany({ where: { userId: params.id } }),
      prisma.post.deleteMany({ where: { authorId: params.id } }),
      prisma.portfolioItem.deleteMany({ where: { userId: params.id } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: params.id } }),
      prisma.user.delete({ where: { id: params.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Delete user error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
