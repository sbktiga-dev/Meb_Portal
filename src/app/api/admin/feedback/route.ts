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

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (type && type !== 'all') where.type = type;

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      }),
      prisma.feedback.count({ where }),
    ]);

    return NextResponse.json({ feedbacks, total });
  } catch (error) {
    console.error('Admin feedback error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
