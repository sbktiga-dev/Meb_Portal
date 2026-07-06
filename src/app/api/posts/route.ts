import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { sanitizeInput, validatePostTitle, validatePostContent } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const authorId = searchParams.get('authorId');

    const where: Record<string, unknown> = { isPublished: true };
    if (category && category !== 'all') where.category = category;
    if (authorId) where.authorId = authorId;

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
          author: { select: { id: true, name: true } },
          _count: { select: { comments: true, likesList: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { getUserFromToken } = await import('@/lib/auth');
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, category, images, tags, isProfilePromo } = body;

    const titleCheck = validatePostTitle(title);
    if (!titleCheck.valid) {
      return NextResponse.json({ error: titleCheck.error }, { status: 400 });
    }

    const contentCheck = validatePostContent(content);
    if (!contentCheck.valid) {
      return NextResponse.json({ error: contentCheck.error }, { status: 400 });
    }

    const ip = getClientIp(request);
    const { allowed } = rateLimit(`post:${user.id}`, 10, 300000);
    if (!allowed) {
      return NextResponse.json({ error: 'Слишком много постов. Подождите 5 минут.' }, { status: 429 });
    }

    const allowedCategories = ['news', 'project', 'article', 'product'];
    const validCategory = allowedCategories.includes(category) ? category : 'news';

    const validImages = Array.isArray(images)
      ? images.filter((img: unknown) => {
          if (typeof img !== 'string') return false;
          if (img.startsWith('/uploads/')) return true;
          try {
            const url = new URL(img);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        }).slice(0, 10)
      : [];
    const validTags = Array.isArray(tags)
      ? tags.filter((t: unknown) => typeof t === 'string' && t.length <= 50).slice(0, 20)
      : [];

    // Check Premium for profile promo
    let profilePromo = false;
    if (isProfilePromo) {
      const subscription = await prisma.subscription.findFirst({
        where: { userId: user.id, status: 'active', plan: 'premium' },
      });
      if (subscription) profilePromo = true;
    }

    const post = await prisma.post.create({
      data: {
        title: sanitizeInput(title),
        content: sanitizeInput(content),
        category: validCategory,
        images: JSON.stringify(validImages),
        tags: JSON.stringify(validTags),
        authorId: user.id,
        isProfilePromo: profilePromo,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
