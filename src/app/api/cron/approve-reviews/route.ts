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

    const now = new Date();

    const result = await prisma.userProfileReview.updateMany({
      where: {
        status: 'pending',
        expiresAt: { lte: now },
      },
      data: {
        status: 'auto_approved',
        respondedAt: now,
      },
    });

    return NextResponse.json({ 
      approved: result.count,
      timestamp: now.toISOString(),
    });
  } catch (e) {
    console.error('Auto-approve reviews error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
