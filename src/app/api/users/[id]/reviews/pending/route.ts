export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    if (user.id !== params.id) {
      return NextResponse.json({ error: 'Нет прав' }, { status: 403 });
    }

    const pendingReviews = await prisma.userProfileReview.findMany({
      where: {
        targetUserId: params.id,
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    return NextResponse.json({ reviews: pendingReviews });
  } catch (e) {
    console.error('Pending reviews error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
