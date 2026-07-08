export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: { in: ['pending', 'active'] } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subscription });
  } catch (e) {
    console.error('Subscription GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const existing = await prisma.subscription.findFirst({
      where: { userId: user.id, status: { in: ['pending', 'active'] } },
    });
    if (existing) {
      return NextResponse.json({ error: 'У вас уже есть активная подписка или заявка' }, { status: 400 });
    }

    const body = await request.json();
    const { plan, period } = body;

    if (!plan || !['lite', 'pro', 'premium'].includes(plan)) {
      return NextResponse.json({ error: 'Неверный план. Допустимые: lite, pro, premium' }, { status: 400 });
    }
    if (!period || !['monthly', 'yearly'].includes(period)) {
      return NextResponse.json({ error: 'Неверный период. Допустимые: monthly, yearly' }, { status: 400 });
    }

    const subscription = await prisma.subscription.create({
      data: { plan, period, userId: user.id },
    });

    logActivity({ action: 'subscription_create', userId: user.id, details: `Подписка: ${plan} (${period})` });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (e) {
    console.error('Subscription POST error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
