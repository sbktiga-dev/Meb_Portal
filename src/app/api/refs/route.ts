import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [references, total] = await Promise.all([
      prisma.reference.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.reference.count({ where }),
    ]);

    const parsed = references.map((r) => {
      let content: unknown;
      try {
        content = JSON.parse(r.content as string);
      } catch {
        content = r.content;
      }
      return { ...r, content };
    });

    const res = NextResponse.json({
      references: parsed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    if (!category && !search) {
      res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    }
    return res;
  } catch (error) {
    console.error('Refs GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
