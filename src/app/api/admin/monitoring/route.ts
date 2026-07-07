import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) return NextResponse.json({ error: 'Невалидный токен' }, { status: 401 });
    const admin = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true } });
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const [users, posts, images, products, feedback, activities] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.image.count(),
      prisma.product.count(),
      prisma.feedback.count(),
      prisma.activityLog.count(),
    ]);

    const uptimeMs = process.uptime() * 1000;
    const hours = Math.floor(uptimeMs / 3600000);
    const minutes = Math.floor((uptimeMs % 3600000) / 60000);
    const uptime = `${hours}ч ${minutes}м`;

    const mem = process.memoryUsage();
    const recentErrors = await prisma.activityLog.findMany({
      where: { action: { in: ['ban', 'user_delete', 'post_delete'] } },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { action: true, details: true, createdAt: true },
    });

    return NextResponse.json({
      db: { users, posts, images, products, feedback, activities },
      uptime,
      memory: { used: Math.round(mem.heapUsed / 1024 / 1024), total: Math.round(mem.heapTotal / 1024 / 1024) },
      nodeVersion: process.version,
      platform: process.platform,
      recentErrors,
    });
  } catch (error) {
    console.error('Admin monitoring error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
