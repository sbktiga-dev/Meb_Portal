import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [users, images, documents, suppliers, companies, specialists, products] = await Promise.all([
      prisma.user.count(),
      prisma.image.count(),
      prisma.document.count(),
      prisma.supplier.count(),
      prisma.company.count(),
      prisma.specialist.count(),
      prisma.product.count(),
    ]);

    return NextResponse.json({
      stats: { users, images, documents, suppliers, companies, specialists, products },
    }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } });
  } catch (e) {
    console.error('Stats GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
