import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Increment download count
    await prisma.document.update({
      where: { id: params.id },
      data: { downloads: { increment: 1 } },
    });

    return NextResponse.json({ document });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
