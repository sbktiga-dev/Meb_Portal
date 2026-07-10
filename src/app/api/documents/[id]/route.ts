export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Документ не найден' }, { status: 404 });
    }

    const authHeader = request.headers.get('authorization');
    const isDownload = authHeader?.startsWith('Bearer ');

    if (isDownload) {
      try {
        await prisma.document.update({
          where: { id: params.id },
          data: { downloads: { increment: 1 } },
        });
      } catch (e) {
        console.error('Document download count update error:', e);
      }
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
