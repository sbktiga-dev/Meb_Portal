export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const boost = await prisma.productBoost.findUnique({
      where: { productId: params.id },
    });

    if (!boost || !boost.active || boost.budget <= boost.spent) {
      return NextResponse.json({ success: true, charged: false });
    }

    const newSpent = boost.spent + boost.costPerClick;
    const stillActive = newSpent < boost.budget;

    await prisma.productBoost.update({
      where: { id: boost.id },
      data: {
        spent: newSpent,
        clicks: { increment: 1 },
        active: stillActive,
      },
    });

    return NextResponse.json({ success: true, charged: true, remaining: boost.budget - newSpent });
  } catch (e) {
    console.error('Boost click error:', e);
    return NextResponse.json({ success: true, charged: false });
  }
}
