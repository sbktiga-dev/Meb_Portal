import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) return NextResponse.json({ error: 'Невалидный токен' }, { status: 401 });

    const { section } = await req.json();
    const validSections = ['feed', 'gallery', 'products', 'events', 'documents', 'refs'];
    if (!validSections.includes(section)) {
      return NextResponse.json({ error: 'Неизвестная секция' }, { status: 400 });
    }

    await prisma.userSectionView.upsert({
      where: { userId_section: { userId: payload.userId, section } },
      update: { lastViewed: new Date() },
      create: { userId: payload.userId, section, lastViewed: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Content badges seen error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
