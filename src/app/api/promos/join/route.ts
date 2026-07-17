export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { getPromoByKey } from '@/lib/promos';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });

    const body = await request.json();
    const { promoKey, proofUrl, proofImages, note } = body;

    if (!promoKey) return NextResponse.json({ error: 'promoKey обязателен' }, { status: 400 });

    const promo = getPromoByKey(promoKey);
    if (!promo) return NextResponse.json({ error: 'Акция не найдена' }, { status: 404 });

    const existing = await prisma.promoParticipation.findUnique({
      where: { userId_promoKey: { userId: user.id, promoKey } },
    });
    if (existing) {
      if (existing.status === 'approved' || existing.status === 'completed') {
        return NextResponse.json({ error: 'Вы уже участвуете в этой акции' }, { status: 400 });
      }
      // Update existing pending/rejected
      const updated = await prisma.promoParticipation.update({
        where: { id: existing.id },
        data: {
          proofUrl: proofUrl || existing.proofUrl,
          proofImages: proofImages ? JSON.stringify(proofImages) : existing.proofImages,
          note: note || existing.note,
          status: 'pending',
        },
      });
      return NextResponse.json({ participation: updated });
    }

    const participation = await prisma.promoParticipation.create({
      data: {
        promoKey,
        userId: user.id,
        proofUrl: proofUrl || null,
        proofImages: proofImages ? JSON.stringify(proofImages) : '[]',
        note: note || null,
        status: promo.type === 'auto' ? 'pending' : 'pending',
      },
    });

    return NextResponse.json({ participation }, { status: 201 });
  } catch (e) {
    console.error('Promo join error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
