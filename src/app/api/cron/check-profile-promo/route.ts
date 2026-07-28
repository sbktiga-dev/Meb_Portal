export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pending = await prisma.promoParticipation.findMany({
      where: { promoKey: 'profile_100', status: 'pending' },
      include: { user: { select: { id: true, avatar: true, cover: true, bio: true, location: true, phone: true, socialLinks: true, verifiedBadge: true } } },
    });

    let approved = 0;

    for (const p of pending) {
      const u = p.user;
      const socialLinks = JSON.parse(u.socialLinks || '{}');
      const hasSocialLinks = Object.values(socialLinks).some(v => typeof v === 'string' && v.trim().length > 0);

      const isComplete =
        !!u.avatar &&
        !!u.cover &&
        !!u.bio && u.bio.trim().length >= 10 &&
        !!u.location && u.location.trim().length > 0 &&
        !!u.phone && u.phone.trim().length >= 10 &&
        hasSocialLinks;

      if (isComplete) {
        await prisma.$transaction([
          prisma.promoParticipation.update({
            where: { id: p.id },
            data: { status: 'approved' },
          }),
          prisma.user.update({
            where: { id: u.id },
            data: { verifiedBadge: true },
          }),
        ]);
        approved++;
      }
    }

    return NextResponse.json({ checked: pending.length, approved, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('Check profile promo error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
