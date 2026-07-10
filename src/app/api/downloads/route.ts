import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
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
    if (!payload) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const downloads = await prisma.download.findMany({
      where: { userId: payload.userId },
      include: {
        image: {
          select: {
            title: true,
            style: true,
            category: true,
            url: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const total = await prisma.download.count({ where: { userId: payload.userId } });

    return NextResponse.json({ downloads, pagination: { total } });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { imageId } = body;

    if (!imageId) {
      return NextResponse.json({ error: 'imageId обязателен' }, { status: 400 });
    }

    const image = await prisma.image.findUnique({ where: { id: imageId } });
    if (!image) {
      return NextResponse.json({ error: 'Изображение не найдено' }, { status: 404 });
    }

    const existing = await prisma.download.findFirst({
      where: { userId: payload.userId, imageId },
    });

    if (existing) {
      return NextResponse.json({ success: true, url: image.url });
    }

    await prisma.$transaction([
      prisma.download.create({
        data: { userId: payload.userId, imageId },
      }),
      prisma.image.update({
        where: { id: imageId },
        data: { downloads: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ success: true, url: image.url });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
