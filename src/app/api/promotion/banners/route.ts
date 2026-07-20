export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { PLAN_LITE, PLAN_PREMIUM, ROLE_CLIENT } from '@/lib/constants';

const DURATION_DAYS: Record<number, number> = { 7: 7, 14: 14, 30: 30 };

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const banners = await prisma.banner.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ banners });
  } catch (error) {
    console.error('Banners GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    if (user.role === ROLE_CLIENT) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    // Check subscription
    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'active' },
    });
    if (!subscription) {
      return NextResponse.json({ error: 'Необходима подписка Lite или Pro' }, { status: 403 });
    }

    // Parse body first to get position for limit check
    const body = await req.json();
    const { title, imageUrl, linkUrl, position, duration, targetCategory, bannerType, images } = body;

    if (!title || !linkUrl || !duration || !DURATION_DAYS[duration]) {
      return NextResponse.json({ error: 'title, linkUrl и duration (7/14/30) обязательны' }, { status: 400 });
    }

    if (position && !['feed', 'gallery', 'products', 'both'].includes(position)) {
      return NextResponse.json({ error: 'position: feed, gallery, products или both' }, { status: 400 });
    }

    // Check banner limit per position
    const bannerLimits: Record<string, number> = { [PLAN_LITE]: 1, pro: 2, [PLAN_PREMIUM]: 4 };
    const maxBanners = bannerLimits[subscription.plan] || 2;
    const bannerPosition = position || 'both';
    const positionLabel = bannerPosition === 'both' ? 'Лента+Каталог+Товары' : bannerPosition === 'feed' ? 'Лента' : bannerPosition === 'gallery' ? 'Каталог' : 'Товары';

    const countWhere: Record<string, unknown> = {
      userId: user.id,
      status: { in: ['pending', 'active'] },
      OR: [
        { position: 'both' },
        { position: bannerPosition },
      ],
    };

    if (subscription.plan !== PLAN_LITE) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      countWhere.createdAt = { gte: weekAgo };
    }

    const recentBanners = await prisma.banner.count({ where: countWhere });
    if (recentBanners >= maxBanners) {
      const label = subscription.plan === PLAN_LITE ? `${maxBanners} баннер (${positionLabel})` : `${maxBanners} баннеров/неделю на ${positionLabel}`;
      return NextResponse.json({ error: `Лимит: ${label}` }, { status: 403 });
    }

    if (!imageUrl && !(bannerType === 'panorama' && images && images.length === 5) && !(bannerType === 'mini' && images && images.length >= 2)) {
      return NextResponse.json({ error: 'imageUrl обязателен (или 5 images для панорамы, 2 images для мини)' }, { status: 400 });
    }

    const validCategories = ['all', 'kitchens', 'wardrobes', 'tables', 'shelves', 'sofas', 'beds', 'hardware', 'materials'];
    const category = validCategories.includes(targetCategory) ? targetCategory : 'all';

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + DURATION_DAYS[duration]);

    const validBannerTypes = ['standard', 'panorama', 'mini'];
    const bType = validBannerTypes.includes(bannerType) ? bannerType : 'standard';
    const imagesJson = images && Array.isArray(images) ? JSON.stringify(images) : '[]';

    const banner = await prisma.banner.create({
      data: {
        title,
        imageUrl: imageUrl || (images && images[0]) || '',
        linkUrl,
        position: position || 'both',
        targetCategory: category,
        bannerType: bType,
        images: imagesJson,
        userId: user.id,
        startDate: now,
        endDate,
        status: 'pending',
      },
    });

    logActivity({ action: 'banner_create', userId: user.id, details: `Баннер: ${title || 'без названия'}` });

    return NextResponse.json({ banner }, { status: 201 });
  } catch (error) {
    console.error('Banners POST error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
