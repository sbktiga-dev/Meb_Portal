export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const position = searchParams.get('position') || 'feed';
    const now = new Date();

    const promotions = await prisma.promotion.findMany({
      where: {
        status: 'active',
        endDate: { gt: now },
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
              select: { id: true, name: true, avatar: true, role: true },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
      take: 5,
    });

    const banners = await prisma.banner.findMany({
      where: {
        status: 'active',
        endDate: { gt: now },
        OR: [
          { position: 'both' },
          { position },
        ],
      },
      orderBy: { startDate: 'desc' },
      take: 3,
    });

    return NextResponse.json({
      promotions: promotions.map(p => ({ ...p.post, isPromoted: true, promotionId: p.id })),
      banners,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
