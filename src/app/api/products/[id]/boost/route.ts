export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const boost = await prisma.productBoost.findUnique({
      where: { productId: params.id },
      select: { id: true, costPerClick: true, budget: true, spent: true, clicks: true, active: true },
    });
    return NextResponse.json({ boost });
  } catch (e) {
    console.error('Boost GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const product = await prisma.product.findUnique({ where: { id: params.id } });
    if (!product) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    const isOwner =
      (product.companyId && (await prisma.company.findUnique({ where: { id: product.companyId } }))?.id && user.role === 'COMPANY') ||
      (product.supplierId && user.role === 'SUPPLIER') ||
      (product.manufacturerId && user.role === 'MANUFACTURER');

    const body = await request.json();
    const costPerClick = Math.min(50, Math.max(1, Number(body.costPerClick) || 5));
    const budget = Math.max(costPerClick, Number(body.budget) || 100);

    const existing = await prisma.productBoost.findUnique({ where: { productId: params.id } });

    if (existing) {
      const updated = await prisma.productBoost.update({
        where: { id: existing.id },
        data: { costPerClick, budget, active: true },
      });
      return NextResponse.json({ boost: updated });
    }

    const boost = await prisma.productBoost.create({
      data: {
        productId: params.id,
        userId: user.id,
        costPerClick,
        budget,
        active: true,
      },
    });

    return NextResponse.json({ boost });
  } catch (e) {
    console.error('Boost POST error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const boost = await prisma.productBoost.findUnique({ where: { productId: params.id } });
    if (!boost || boost.userId !== user.id) {
      return NextResponse.json({ error: 'Буст не найден' }, { status: 404 });
    }

    await prisma.productBoost.update({
      where: { id: boost.id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Boost DELETE error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
