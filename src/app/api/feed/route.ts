import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest';
    const rawPage = parseInt(searchParams.get('page') || '1');
    const rawLimit = parseInt(searchParams.get('limit') || '10');
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Math.min(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 10, 100);
    const authorId = searchParams.get('authorId');
    const filter = searchParams.get('filter');

    const where: Record<string, unknown> = { isPublished: true };
    if (category && category !== 'all') where.category = category;
    if (authorId) where.authorId = authorId;

    if (filter === 'subscriptions') {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const user = await getUserFromToken(token);
        if (user) {
          const followed = await prisma.follow.findMany({
            where: { followerId: user.id },
            select: { followingId: true },
          });
          const followedIds = followed.map((f) => f.followingId);
          followedIds.push(user.id);
          where.authorId = { in: followedIds };
        }
      }
    }

    const orderBy = sort === 'popular'
      ? { likes: 'desc' as const }
      : sort === 'discussed'
        ? { comments: { _count: 'desc' as const } }
        : { createdAt: 'desc' as const };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          _count: { select: { comments: true, likesList: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    let likedPostIds: string[] = [];
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const u = await getUserFromToken(authHeader.split(' ')[1]);
        if (u) {
          const postIds = posts.map(p => p.id);
          const likes = await prisma.postLike.findMany({
            where: { userId: u.id, postId: { in: postIds } },
            select: { postId: true },
          });
          likedPostIds = likes.map(l => l.postId);
        }
      } catch {}
    }

    const res = NextResponse.json({
      posts,
      likedPostIds,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
    if (!filter) {
      res.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
    }
    return res;
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
