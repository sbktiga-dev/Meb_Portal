import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ feed: 0, gallery: 0, products: 0, events: 0, documents: 0, refs: 0 });
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) return NextResponse.json({ feed: 0, gallery: 0, products: 0, events: 0, documents: 0, refs: 0 });

    const sections = ['feed', 'gallery', 'products', 'events', 'documents', 'refs'];
    const views = await prisma.userSectionView.findMany({ where: { userId: payload.userId } });
    const viewMap = new Map(views.map(v => [v.section, v.lastViewed]));

    const now = new Date();
    const defaultDate = new Date(0);

    const [feed, gallery, products, events, documents, refs] = await Promise.all([
      prisma.post.count({ where: { createdAt: { gt: viewMap.get('feed') || defaultDate } } }),
      prisma.image.count({ where: { createdAt: { gt: viewMap.get('gallery') || defaultDate } } }),
      prisma.product.count({ where: { createdAt: { gt: viewMap.get('products') || defaultDate } } }),
      prisma.event.count({ where: { createdAt: { gt: viewMap.get('events') || defaultDate } } }),
      prisma.document.count({ where: { createdAt: { gt: viewMap.get('documents') || defaultDate } } }),
      prisma.reference.count({ where: { createdAt: { gt: viewMap.get('refs') || defaultDate } } }),
    ]);

    return NextResponse.json({ feed, gallery, products, events, documents, refs });
  } catch (error) {
    console.error('Content badges error:', error);
    return NextResponse.json({ feed: 0, gallery: 0, products: 0, events: 0, documents: 0, refs: 0 });
  }
}
