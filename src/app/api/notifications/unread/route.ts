import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ unread: 0 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ unread: 0 });
    }

    const unread = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });

    return NextResponse.json({ unread });
  } catch {
    return NextResponse.json({ unread: 0 });
  }
}
