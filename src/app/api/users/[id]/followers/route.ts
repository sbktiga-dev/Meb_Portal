import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const follows = await prisma.follow.findMany({
      where: { followingId: params.id },
      include: {
        follower: {
          select: { id: true, name: true, email: true, avatar: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const followers = follows.map((f) => f.follower);

    return NextResponse.json({ followers, total: followers.length });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
