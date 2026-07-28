export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { sanitizeInput } from '@/lib/validation';
import { sendPushToUsers } from '@/lib/push';

export async function GET(request: Request) {
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

    const newsletters = await prisma.newsletter.findMany({
      where: { userId: user.id },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ newsletters });
  } catch (e) {
    console.error('Newsletter GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const ip = getClientIp(request);
    const { allowed, resetAt } = rateLimit(`newsletter:${user.id}`, 1, 86400000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Рассылка доступна раз в сутки. Попробуйте позже.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const title = sanitizeInput(body.title || '');
    const content = sanitizeInput(body.body || '');

    if (!title || title.length < 3) {
      return NextResponse.json({ error: 'Заголовок минимум 3 символа' }, { status: 400 });
    }
    if (!content || content.length < 10) {
      return NextResponse.json({ error: 'Текст минимум 10 символов' }, { status: 400 });
    }
    if (title.length > 200) {
      return NextResponse.json({ error: 'Заголовок максимум 200 символов' }, { status: 400 });
    }
    if (content.length > 5000) {
      return NextResponse.json({ error: 'Текст максимум 5000 символов' }, { status: 400 });
    }

    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      select: { followerId: true },
    });

    if (followers.length === 0) {
      return NextResponse.json({ error: 'У вас нет подписчиков' }, { status: 400 });
    }

    const followerIds = followers.map(f => f.followerId);

    await prisma.notification.createMany({
      data: followerIds.map(fid => ({
        type: 'newsletter',
        message: `${user.name || 'Автор'}: ${title}`,
        userId: fid,
        fromUserId: user.id,
        link: `/profile/${user.id}`,
      })),
    });

    sendPushToUsers(followerIds, {
      title: user.name || 'МебПортал',
      body: title,
      url: `/profile/${user.id}`,
    }).catch(() => {});

    const newsletter = await prisma.newsletter.create({
      data: {
        userId: user.id,
        title,
        body: content,
        recipientCount: followerIds.length,
      },
    });

    return NextResponse.json({ newsletter, recipients: followerIds.length });
  } catch (e) {
    console.error('Newsletter POST error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
