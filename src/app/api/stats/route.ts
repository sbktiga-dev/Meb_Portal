import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [users, images, documents, suppliers, companies] = await Promise.all([
      prisma.user.count(),
      prisma.image.count(),
      prisma.document.count(),
      prisma.supplier.count(),
      prisma.company.count(),
    ]);

    return NextResponse.json({
      stats: { users, images, documents, suppliers, companies },
    });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
