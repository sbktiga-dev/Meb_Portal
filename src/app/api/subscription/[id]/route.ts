export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    const subscription = await prisma.subscription.findUnique({ where: { id: params.id } });
    if (!subscription) {
      return NextResponse.json({ error: 'Подписка не найдена' }, { status: 404 });
    }
    if (subscription.userId !== user.id) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }
    if (subscription.status !== 'pending') {
      return NextResponse.json({ error: 'Можно отменить только заявку' }, { status: 400 });
    }

    await prisma.subscription.update({
      where: { id: params.id },
      data: { status: 'cancelled' },
    });

    logActivity({ action: 'subscription_cancel', userId: user.id, details: `Подписка ${params.id} отменена` });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Subscription DELETE error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
