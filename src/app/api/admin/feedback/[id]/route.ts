import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) return NextResponse.json({ error: 'Невалидный токен' }, { status: 401 });
    const admin = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true } });
    if (admin?.role !== 'ADMIN') return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    await prisma.feedback.delete({ where: { id: params.id } });
    logActivity({ action: 'feedback_delete', userId: payload.userId, details: `Обратная связь ${params.id} удалена` });
    return NextResponse.json({ message: 'Удалено' });
  } catch (error) {
    console.error('Admin feedback delete error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
