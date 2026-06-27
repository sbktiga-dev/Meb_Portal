export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.post.update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Views error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
