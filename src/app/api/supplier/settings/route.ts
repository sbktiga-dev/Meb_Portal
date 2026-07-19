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

    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true, supplierId: true } });
    if (!user || user.role !== 'SUPPLIER' || !user.supplierId) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    // Check active subscription
    const subscription = await prisma.subscription.findFirst({
      where: { userId: payload.userId, status: 'active' },
    });
    if (!subscription) {
      return NextResponse.json({ error: 'Требуется активная подписка' }, { status: 403 });
    }

    const { notifyNewCompanies } = await req.json();

    await prisma.supplier.update({
      where: { id: user.supplierId },
      data: { notifyNewCompanies: Boolean(notifyNewCompanies) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Supplier settings error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) return NextResponse.json({ error: 'Невалидный токен' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true, supplierId: true } });
    if (!user || user.role !== 'SUPPLIER' || !user.supplierId) {
      return NextResponse.json({ notifyNewCompanies: false });
    }

    const supplier = await prisma.supplier.findUnique({ where: { id: user.supplierId }, select: { notifyNewCompanies: true } });

    const subscription = await prisma.subscription.findFirst({
      where: { userId: payload.userId, status: 'active' },
    });

    return NextResponse.json({
      notifyNewCompanies: supplier?.notifyNewCompanies || false,
      hasSubscription: !!subscription,
    });
  } catch (error) {
    console.error('Supplier settings GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
