import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request as Parameters<typeof getClientIp>[0]);
    const { allowed, resetAt } = rateLimit(`search:${ip}`, 30, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Попробуйте через минуту.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: { images: [], documents: [], posts: [], users: [] } });
    }

    const searchQuery = { contains: q };

    const [images, documents, posts, users] = await Promise.all([
      prisma.image.findMany({
        where: { OR: [{ title: searchQuery }, { description: searchQuery }, { tags: searchQuery }] },
        take: 5,
        orderBy: { downloads: 'desc' },
      }),
      prisma.document.findMany({
        where: { OR: [{ title: searchQuery }, { description: searchQuery }, { category: searchQuery }] },
        take: 5,
        orderBy: { downloads: 'desc' },
      }),
      prisma.post.findMany({
        where: {
          isPublished: true,
          OR: [{ title: searchQuery }, { content: searchQuery }, { tags: searchQuery }],
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.user.findMany({
        where: { OR: [{ name: searchQuery }, { email: searchQuery }] },
        take: 5,
        select: { id: true, name: true, avatar: true, role: true },
      }),
    ]);

    return NextResponse.json({
      results: { images, documents, posts, users },
    });
  } catch (e) {
    console.error('Search GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
