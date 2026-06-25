export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const specialist = await prisma.specialist.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    if (!specialist) {
      return NextResponse.json({ error: 'Специалист не найден' }, { status: 404 });
    }

    return NextResponse.json({ specialist });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
