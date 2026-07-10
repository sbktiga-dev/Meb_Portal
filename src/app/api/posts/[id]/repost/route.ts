export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { sanitizeInput } from '@/lib/validation';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const ip = getClientIp(request);
    const { allowed, resetAt } = rateLimit(`repost:${user.id}:${ip}`, 20, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много репостов. Попробуйте позже.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) {
      return NextResponse.json({ error: 'Пост не найден' }, { status: 404 });
    }

    if (post.authorId === user.id) {
      return NextResponse.json({ error: 'Нельзя репостнуть свой пост' }, { status: 400 });
    }

    const existing = await prisma.repost.findUnique({
      where: { userId_postId: { userId: user.id, postId: params.id } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Уже репостнуто' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    const repost = await prisma.repost.create({
      data: {
        userId: user.id,
        postId: params.id,
        comment: sanitizeInput(body.comment?.trim() || '') || null,
      },
    }).catch(() => null);

    if (!repost) {
      return NextResponse.json({ error: 'Уже репостнуто' }, { status: 400 });
    }

    return NextResponse.json({ repost }, { status: 201 });
  } catch (e) {
    console.error('Repost error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const repost = await prisma.repost.findUnique({
      where: { userId_postId: { userId: user.id, postId: params.id } },
    });

    if (!repost) {
      return NextResponse.json({ error: 'Репост не найден' }, { status: 404 });
    }

    await prisma.repost.delete({ where: { id: repost.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
