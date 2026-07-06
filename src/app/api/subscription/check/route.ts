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

    const isPro = subscription.plan === 'pro';

    const bannerCount = await prisma.banner.count({
      where: { userId: user.id, status: { in: ['pending', 'active'] } },
    });

    return NextResponse.json({
      canPromote: true,
      canCreateBanner: isPro || bannerCount < 1,
      bannerCount,
      maxBanners: isPro ? -1 : 1,
      plan: subscription.plan,
      period: subscription.period,
      endDate: subscription.endDate,
    });
  } catch (e) {
    console.error('Subscription check error:', e);
    return NextResponse.json({ canPromote: false, canCreateBanner: false, plan: null });
  }
}
