export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeInput, validatePostTitle, validatePostContent } from '@/lib/validation';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { getUserFromToken } = await import('@/lib/auth');
        const u = await getUserFromToken(authHeader.split(' ')[1]);
        if (u) userId = u.id;
      } catch {}
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        comments: {
          include: { author: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { comments: true, likesList: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Пост не найден' }, { status: 404 });
    }

    let liked = false;
    if (userId) {
      const existingLike = await prisma.postLike.findUnique({
        where: { userId_postId: { userId, postId: params.id } },
      });
      liked = !!existingLike;
    }

    await prisma.post.update({ where: { id: params.id }, data: { views: { increment: 1 } } });
    post.views += 1;

    return NextResponse.json({ post, liked });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) {
      return NextResponse.json({ error: 'Пост не найден' }, { status: 404 });
    }
    if (post.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, category, images, tags } = body;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      const titleCheck = validatePostTitle(title);
      if (!titleCheck.valid) return NextResponse.json({ error: titleCheck.error }, { status: 400 });
      updateData.title = sanitizeInput(title);
    }
    if (content !== undefined) {
      const contentCheck = validatePostContent(content);
      if (!contentCheck.valid) return NextResponse.json({ error: contentCheck.error }, { status: 400 });
      updateData.content = sanitizeInput(content);
    }
    if (category !== undefined) {
      const allowed = ['news', 'project', 'article', 'product'];
      updateData.category = allowed.includes(category) ? category : 'news';
    }
    if (images !== undefined) {
      const validImages = Array.isArray(images)
        ? images.filter((img: unknown) => {
            if (typeof img !== 'string') return false;
            if (img.startsWith('/uploads/')) return true;
            try { const u = new URL(img); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
          }).slice(0, 10)
        : [];
      updateData.images = JSON.stringify(validImages);
    }
    if (tags !== undefined) {
      const validTags = Array.isArray(tags)
        ? tags.filter((t: unknown) => typeof t === 'string' && t.length <= 50).slice(0, 20)
        : [];
      updateData.tags = JSON.stringify(validTags);
    }

    const updated = await prisma.post.update({
      where: { id: params.id },
      data: updateData,
      include: { author: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ post: updated });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) {
      return NextResponse.json({ error: 'Пост не найден' }, { status: 404 });
    }
    if (post.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
