export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const banner = await prisma.banner.findUnique({ where: { id: params.id } });
    if (!banner) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
    if (banner.userId !== user.id) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const body = await req.json();
    const { title, imageUrl, linkUrl, position, targetCategory, bannerType, images } = body;

    const updateData: Record<string, any> = {};
    if (title) updateData.title = title;
    if (imageUrl) updateData.imageUrl = imageUrl;
    if (linkUrl) updateData.linkUrl = linkUrl;
    if (position) updateData.position = position;
    if (targetCategory) updateData.targetCategory = targetCategory;
    if (bannerType) updateData.bannerType = bannerType;
    if (images) updateData.images = JSON.stringify(images);

    const updated = await prisma.banner.update({ where: { id: params.id }, data: updateData });
    return NextResponse.json({ banner: updated });
  } catch (error) {
    console.error('Banner PUT error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const banner = await prisma.banner.findUnique({ where: { id: params.id } });
    if (!banner) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });
    if (banner.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    await prisma.banner.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Banner DELETE error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
