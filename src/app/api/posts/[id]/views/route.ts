export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const ip = getClientIp(request);
    const { allowed, resetAt } = rateLimit(`views:${ip}`, 30, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true, isPublished: true },
    });

    if (!post || !post.isPublished) {
      return NextResponse.json({ error: 'Пост не найден' }, { status: 404 });
    }

    await prisma.post.update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
