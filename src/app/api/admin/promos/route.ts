export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, any> = {};
    if (status && status !== 'all') where.status = status;

    const participations = await prisma.promoParticipation.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ participations });
  } catch (e) {
    console.error('Admin promos GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) return NextResponse.json({ error: 'id и status обязательны' }, { status: 400 });
    if (!['approved', 'rejected'].includes(status)) return NextResponse.json({ error: 'status: approved или rejected' }, { status: 400 });

    const participation = await prisma.promoParticipation.findUnique({ where: { id } });
    if (!participation) return NextResponse.json({ error: 'Не найдено' }, { status: 404 });

    const updated = await prisma.promoParticipation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ participation: updated });
  } catch (e) {
    console.error('Admin promos PATCH error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
