import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

const ALLOWED_ROLES = ['USER', 'COMPANY', 'SUPPLIER', 'MANUFACTURER', 'CLIENT', 'ADMIN'];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) return NextResponse.json({ error: 'Невалидный токен' }, { status: 401 });
    const admin = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true } });
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    if (params.id === payload.userId) {
      return NextResponse.json({ error: 'Нельзя изменить свою роль' }, { status: 400 });
    }

    const { role } = await req.json();
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Невалидная роль' }, { status: 400 });
    }

    await prisma.user.update({ where: { id: params.id }, data: { role } });
    logActivity({ action: 'role_change', userId: payload.userId, details: `Роль пользователя ${params.id} изменена на ${role}` });
    return NextResponse.json({ role });
  } catch (error) {
    console.error('Admin role error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
