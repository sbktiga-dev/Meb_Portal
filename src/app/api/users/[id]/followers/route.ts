export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: params.id },
        include: {
          follower: {
            select: { id: true, name: true, avatar: true, role: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.follow.count({ where: { followingId: params.id } }),
    ]);

    const followers = follows.map((f) => f.follower);

    return NextResponse.json({ followers, total, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
