export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { getActivePromos } from '@/lib/promos';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const user = await getUserFromToken(token);
      if (user) userId = user.id;
    }

    const promos = getActivePromos();

    let participations: Record<string, string> = {};
    if (userId) {
      const parts = await prisma.promoParticipation.findMany({
        where: { userId },
        select: { promoKey: true, status: true },
      });
      parts.forEach(p => { participations[p.promoKey] = p.status; });
    }

    const enriched = promos.map(p => ({
      ...p,
      myStatus: participations[p.key] || null,
    }));

    return NextResponse.json({ promos: enriched });
  } catch (e) {
    console.error('Promos GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
