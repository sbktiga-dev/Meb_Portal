import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [users, images, documents, suppliers, companies, specialists, manufacturers, downloads, posts, products, groups, events, notifications] = await Promise.all([
      prisma.user.count(),
      prisma.image.count(),
      prisma.document.count(),
      prisma.supplier.count(),
      prisma.company.count(),
      prisma.specialist.count(),
      prisma.manufacturer.count(),
      prisma.download.count(),
      prisma.post.count(),
      prisma.product.count(),
      prisma.group.count(),
      prisma.event.count(),
      prisma.notification.count(),
    ]);

    const [newUsers7d, newUsers30d, newPosts7d, newPosts30d, unreadNotifications] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.post.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.post.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.notification.count({ where: { read: false } }),
    ]);

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true, avatar: true },
    });

    const popularPosts = await prisma.post.findMany({
      take: 5,
      orderBy: { views: 'desc' },
      select: { id: true, title: true, views: true, likes: true, createdAt: true, author: { select: { name: true } } },
    });

    const popularImages = await prisma.image.findMany({
      take: 5,
      orderBy: { downloads: 'desc' },
      select: { id: true, title: true, downloads: true, createdAt: true },
    });

    const registrationsByDay = await prisma.$queryRaw<{ date: string; count: number }[]>`
      SELECT date(createdAt) as date, COUNT(*) as count
      FROM User
      WHERE createdAt >= ${thirtyDaysAgo}
      GROUP BY date(createdAt)
      ORDER BY date ASC
    `;

    return NextResponse.json({
      stats: {
        users, images, documents, suppliers, companies, specialists, manufacturers,
        downloads, posts, products, groups, events, notifications,
        newUsers7d, newUsers30d, newPosts7d, newPosts30d, unreadNotifications,
      },
      recentUsers,
      popularPosts,
      popularImages,
      registrationsByDay,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
