export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    // Get user's referral code
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referralCode: true },
    });

    // Count referrals made
    const referralCount = await prisma.referral.count({
      where: { referrerId: user.id },
    });

    // Get recent referrals
    const recentReferrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
      include: {
        referred: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      referralCode: userData?.referralCode,
      referralCount,
      recentReferrals,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://mebportal.online',
    });
  } catch (e) {
    console.error('Referral GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
