export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        avatar: true,
        cover: true,
        bio: true,
        location: true,
        website: true,
        role: true,
        inn: true,
        phone: true,
        socialLinks: true,
        interests: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
            portfolio: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const specialist = user.role === 'USER' ? await prisma.specialist.findFirst({
      where: { user: { id: params.id } },
      select: { type: true, description: true, experience: true, rating: true },
    }) : null;

    const company = user.role === 'COMPANY' ? await prisma.company.findFirst({
      where: { users: { some: { id: params.id } } },
      select: { id: true, name: true, description: true, logo: true, website: true, isVerified: true },
    }) : null;

    const supplier = user.role === 'SUPPLIER' ? await prisma.supplier.findFirst({
      where: { users: { some: { id: params.id } } },
      select: { id: true, companyName: true, description: true, logo: true, website: true, categories: true, isVerified: true },
    }) : null;

    const manufacturer = user.role === 'MANUFACTURER' ? await prisma.manufacturer.findFirst({
      where: { users: { some: { id: params.id } } },
      select: { id: true, name: true, description: true, logo: true, website: true, isVerified: true },
    }) : null;

    const recentPosts = await prisma.post.findMany({
      where: { authorId: params.id, isPublished: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        images: true,
        likes: true,
        views: true,
        createdAt: true,
        _count: { select: { comments: true } },
      },
    });

    const recentPortfolio = await prisma.portfolioItem.findMany({
      where: { userId: params.id, isPublished: true },
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        images: true,
        category: true,
        createdAt: true,
      },
    });

    const reviewStats = await prisma.userProfileReview.aggregate({
      where: { targetUserId: params.id },
      _avg: { score: true },
      _count: true,
    });

    return NextResponse.json({
      user,
      specialist,
      company,
      supplier,
      manufacturer,
      recentPosts,
      recentPortfolio,
      reviewStats: { average: reviewStats._avg.score, count: reviewStats._count },
    });
  } catch (e) {
    console.error('Profile error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
