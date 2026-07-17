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

    // Check banner limit
    const bannerLimits: Record<string, number> = { [PLAN_LITE]: 1, pro: 2, [PLAN_PREMIUM]: 4 };
    const maxBanners = bannerLimits[subscription.plan] || 2;
    const limitLabel = subscription.plan === PLAN_LITE ? '1 баннер (Lite)' :
      subscription.plan === PLAN_PREMIUM ? '4 баннера в неделю (Premium)' : '2 баннера в неделю (Pro)';

    if (subscription.plan === PLAN_LITE) {
      const activeBanners = await prisma.banner.count({
        where: { userId: user.id, status: { in: ['pending', 'active'] } },
      });
      if (activeBanners >= maxBanners) {
        return NextResponse.json({ error: `Лимит: ${limitLabel}. Обновите подписку` }, { status: 403 });
      }
    } else {
      // Pro/Premium: per week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentBanners = await prisma.banner.count({
        where: { userId: user.id, createdAt: { gte: weekAgo } },
      });
      if (recentBanners >= maxBanners) {
        return NextResponse.json({ error: `Лимит: ${limitLabel}. Попробуйте через неделю` }, { status: 403 });
      }
    }

    const body = await req.json();
    const { title, imageUrl, linkUrl, position, duration, targetCategory, bannerType, images } = body;

    if (!title || !linkUrl || !duration || !DURATION_DAYS[duration]) {
      return NextResponse.json({ error: 'title, linkUrl и duration (7/14/30) обязательны' }, { status: 400 });
    }

    if (!imageUrl && !(bannerType === 'panorama' && images && images.length === 5)) {
      return NextResponse.json({ error: 'imageUrl обязателен (или 5 images для панорамы)' }, { status: 400 });
    }

    if (position && !['feed', 'gallery', 'both'].includes(position)) {
      return NextResponse.json({ error: 'position: feed, gallery или both' }, { status: 400 });
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
