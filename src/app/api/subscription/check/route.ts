export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ canPromote: false, canCreateBanner: false, plan: null });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ canPromote: false, canCreateBanner: false, plan: null });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'active' },
    });

    if (!subscription) {
      return NextResponse.json({ canPromote: false, canCreateBanner: false, plan: null });
    }

    const bannerLimits: Record<string, number> = { lite: 1, pro: 2, premium: 4 };
    const maxBanners = bannerLimits[subscription.plan] || 1;

    const bannerCount = await prisma.banner.count({
      where: { userId: user.id, status: { in: ['pending', 'active'] } },
    });

    let canCreateBanner: boolean;
    if (subscription.plan === 'lite') {
      canCreateBanner = bannerCount < 1;
    } else {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentBanners = await prisma.banner.count({
        where: { userId: user.id, createdAt: { gte: weekAgo } },
      });
      canCreateBanner = recentBanners < maxBanners;
    }

    return NextResponse.json({
      canPromote: true,
      canCreateBanner,
      bannerCount,
      maxBanners,
      plan: subscription.plan,
      period: subscription.period,
      endDate: subscription.endDate,
    });
  } catch (e) {
    console.error('Subscription check error:', e);
    return NextResponse.json({ canPromote: false, canCreateBanner: false, plan: null });
  }
}
