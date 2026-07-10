export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const id = user.id;

    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { userId: id } }),
      prisma.notification.deleteMany({ where: { fromUserId: id } }),
      prisma.postLike.deleteMany({ where: { userId: id } }),
      prisma.comment.deleteMany({ where: { authorId: id } }),
      prisma.repost.deleteMany({ where: { userId: id } }),
      prisma.favorite.deleteMany({ where: { userId: id } }),
      prisma.bookmark.deleteMany({ where: { userId: id } }),
      prisma.download.deleteMany({ where: { userId: id } }),
      prisma.follow.deleteMany({ where: { followerId: id } }),
      prisma.follow.deleteMany({ where: { followingId: id } }),
      prisma.eventParticipant.deleteMany({ where: { userId: id } }),
      prisma.groupMember.deleteMany({ where: { userId: id } }),
      prisma.groupPost.deleteMany({ where: { authorId: id } }),
      prisma.message.deleteMany({ where: { authorId: id } }),
      prisma.conversationParticipant.deleteMany({ where: { userId: id } }),
      prisma.productReview.deleteMany({ where: { userId: id } }),
      prisma.rating.deleteMany({ where: { userId: id } }),
      prisma.userProfileReview.deleteMany({ where: { reviewerId: id } }),
      prisma.userProfileReview.deleteMany({ where: { targetUserId: id } }),
      prisma.promotion.deleteMany({ where: { userId: id } }),
      prisma.banner.deleteMany({ where: { userId: id } }),
      prisma.post.deleteMany({ where: { authorId: id } }),
      prisma.portfolioItem.deleteMany({ where: { userId: id } }),
      prisma.passwordResetToken.deleteMany({ where: { userId: id } }),
      prisma.subscription.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Self-delete error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
