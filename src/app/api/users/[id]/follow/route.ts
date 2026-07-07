export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { rateLimit, getClientIp, RATE_LIMITS } from '@/lib/rateLimit';
import { sendPushToUser } from '@/lib/push';
import { logActivity } from '@/lib/activity';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { allowed, resetAt } = rateLimit(`follow:${user.id}:${ip}`, RATE_LIMITS.follow.maxRequests, RATE_LIMITS.follow.windowMs);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много подписок. Попробуйте через минуту.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    const targetUserId = params.id;

    if (user.id === targetUserId) {
      return NextResponse.json({ error: 'Нельзя подписаться на себя' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({ where: { id: existingFollow.id } });
      return NextResponse.json({ followed: false });
    }

    await prisma.follow.create({
      data: {
        followerId: user.id,
        followingId: targetUserId,
      },
    });

    const userName = user.name || user.email;
    await prisma.notification.create({
      data: {
        type: 'follow',
        message: `${userName} подписался на вас`,
        userId: targetUserId,
        fromUserId: user.id,
        link: `/portfolio/${user.id}`,
      },
    });
    sendPushToUser(targetUserId, {
      title: 'Новая подписка',
      body: `${userName} подписался на вас`,
      url: `/profile/${user.id}`,
    }).catch(() => {});
    logActivity({ action: 'follow', userId: user.id, details: `Подписка на ${targetUserId}` });

    return NextResponse.json({ followed: true });
  } catch (e) {
    console.error('Follow error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
