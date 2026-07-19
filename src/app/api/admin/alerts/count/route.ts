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

    const types = ['new_user', 'new_post', 'new_review', 'new_message', 'new_feedback', 'new_product', 'new_image'];
    const counts: Record<string, number> = {};

    const results = await Promise.all(
      types.map(type => prisma.adminAlert.count({ where: { type, read: false } }))
    );

    types.forEach((type, i) => { counts[type] = results[i]; });

    return NextResponse.json(counts);
  } catch (error) {
    console.error('Admin alerts count error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
