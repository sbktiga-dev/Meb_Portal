export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if requester is authenticated (for phone visibility)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const currentUser = token ? await getUserFromToken(token) : null;
    const isOwner = currentUser?.id === params.id;
    const isAdmin = currentUser?.role === 'ADMIN';

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
        profileViews: true,
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

    // Increment profile views (fire and forget)
    prisma.user.update({ where: { id: params.id }, data: { profileViews: { increment: 1 } } }).catch(() => {});

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
      where: { authorId: params.id, isPublished: true, isProfilePromo: false },
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

    // Promo posts for Premium users
    const promoPosts = await prisma.post.findMany({
      where: { authorId: params.id, isPublished: true, isProfilePromo: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        images: true,
        createdAt: true,
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

    const postStats = await prisma.post.aggregate({
      where: { authorId: params.id, isPublished: true },
      _sum: { views: true, likes: true },
      _count: true,
    });

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [weekPosts, monthPosts] = await Promise.all([
      prisma.post.aggregate({
        where: { authorId: params.id, isPublished: true, createdAt: { gte: weekAgo } },
        _sum: { views: true, likes: true },
        _count: true,
      }),
      prisma.post.aggregate({
        where: { authorId: params.id, isPublished: true, createdAt: { gte: monthAgo } },
        _sum: { views: true, likes: true },
        _count: true,
      }),
    ]);

    // Hide phone for non-owners/non-admins
    const safeUser = {
      ...user,
      phone: (isOwner || isAdmin) ? user.phone : null,
      inn: (isOwner || isAdmin) ? user.inn : null,
    };

    return NextResponse.json({
      user: safeUser,
      specialist,
      company,
      supplier,
      manufacturer,
      recentPosts,
      promoPosts,
      recentPortfolio,
      reviewStats: { average: reviewStats._avg.score, count: reviewStats._count },
      analytics: {
        profileViews: user.profileViews,
        totalViews: postStats._sum.views || 0,
        totalLikes: postStats._sum.likes || 0,
        totalPosts: postStats._count,
        weekViews: weekPosts._sum.views || 0,
        weekLikes: weekPosts._sum.likes || 0,
        weekPosts: weekPosts._count,
        monthViews: monthPosts._sum.views || 0,
        monthLikes: monthPosts._sum.likes || 0,
        monthPosts: monthPosts._count,
      },
    });
  } catch (e) {
    console.error('Profile error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
