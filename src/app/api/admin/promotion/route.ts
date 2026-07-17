export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const promotionWhere = status ? { status } : {};
    const bannerWhere = status ? { status } : {};

    const [promotions, banners] = await Promise.all([
      prisma.promotion.findMany({
        where: promotionWhere,
        include: {
          post: { select: { id: true, title: true, category: true, content: true, images: true, tags: true, author: { select: { name: true, avatar: true } } } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.banner.findMany({
        where: bannerWhere,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ promotions, banners });
  } catch (error) {
    console.error('Promotion GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const body = await req.json();
    const { id, type, status } = body;

    if (!id || !type || !status) {
      return NextResponse.json({ error: 'id, type и status обязательны' }, { status: 400 });
    }

    if (!['promotion', 'banner'].includes(type)) {
      return NextResponse.json({ error: 'type: promotion или banner' }, { status: 400 });
    }

    if (!['pending', 'active', 'expired'].includes(status)) {
      return NextResponse.json({ error: 'status: pending, active или expired' }, { status: 400 });
    }

    const now = new Date();

    if (type === 'promotion') {
      const promotion = await prisma.promotion.findUnique({ where: { id } });
      if (!promotion) {
        return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
      }

      const updateData: Record<string, unknown> = { status };
      if (status === 'active' && promotion.status === 'pending') {
        updateData.startDate = now;
        const endDate = new Date(now);
        const diffMs = promotion.endDate.getTime() - promotion.startDate.getTime();
        endDate.setTime(now.getTime() + diffMs);
        updateData.endDate = endDate;
      }

      const updated = await prisma.promotion.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ promotion: updated });
    } else {
      const banner = await prisma.banner.findUnique({ where: { id } });
      if (!banner) {
        return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
      }

      const updateData: Record<string, unknown> = { status };
      if (status === 'active' && banner.status === 'pending') {
        updateData.startDate = now;
        const endDate = new Date(now);
        const diffMs = banner.endDate.getTime() - banner.startDate.getTime();
        endDate.setTime(now.getTime() + diffMs);
        updateData.endDate = endDate;
      }

      const updated = await prisma.banner.update({
        where: { id },
        data: updateData,
      });

      return NextResponse.json({ banner: updated });
    }
  } catch (error) {
    console.error('Promotion PATCH error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
