import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const follows = await prisma.follow.findMany({
      where: { followerId: params.id },
      include: {
        following: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const following = follows.map((f) => f.following);

    return NextResponse.json({ following, total: following.length });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
