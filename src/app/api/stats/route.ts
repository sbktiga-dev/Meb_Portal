import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [users, images, documents, suppliers, companies, specialists] = await Promise.all([
      prisma.user.count(),
      prisma.image.count(),
      prisma.document.count(),
      prisma.supplier.count(),
      prisma.company.count(),
      prisma.specialist.count(),
    ]);

    return NextResponse.json({
      stats: { users, images, documents, suppliers, companies, specialists },
    });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
