export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const position = searchParams.get('position') || 'feed';
    const interestsParam = searchParams.get('interests');
    const now = new Date();

    let userInterests: string[] = [];
    if (interestsParam) {
      try {
        const parsed = JSON.parse(interestsParam);
        if (Array.isArray(parsed) && parsed.every((v: unknown) => typeof v === 'string')) {
          userInterests = parsed;
        }
      } catch {}
    }

    const promotions = await prisma.promotion.findMany({
      where: {
        status: 'active',
        endDate: { gt: now },
        startDate: { lte: now },
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            content: true,
            category: true,
            images: true,
            tags: true,
            likes: true,
            views: true,
            createdAt: true,
            author: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
      take: 5,
    });

    const bannerWhere: Record<string, unknown> = {
      status: 'active',
      endDate: { gt: now },
      startDate: { lte: now },
      OR: [
        { position: 'both' },
        { position },
      ],
    };

    if (userInterests.length > 0) {
      bannerWhere.AND = [
        {
          OR: [
            { targetCategory: 'all' },
            { targetCategory: { in: userInterests } },
          ],
        },
      ];
    } else {
      bannerWhere.targetCategory = 'all';
    }

    const banners = await prisma.banner.findMany({
      where: bannerWhere,
      orderBy: { startDate: 'desc' },
      take: 3,
    });

    return NextResponse.json({
      promotions: promotions.filter(p => p.post).map(p => ({ ...p.post!, isPromoted: true, promotionId: p.id })),
      banners,
    });
  } catch (error) {
    console.error('Active promotions error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
