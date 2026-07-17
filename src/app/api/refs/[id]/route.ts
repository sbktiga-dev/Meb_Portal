export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reference = await prisma.reference.findUnique({
      where: { id: params.id },
    });

    if (!reference) {
      return NextResponse.json({ error: 'Справочник не найден' }, { status: 404 });
    }

    let content: unknown;
    try {
      content = JSON.parse(reference.content as string);
    } catch {
      content = reference.content;
    }

    return NextResponse.json({ reference: { ...reference, content } });
  } catch (error) {
    console.error('Reference fetch error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user || user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const reference = await prisma.reference.findUnique({
      where: { id: params.id },
    });

    if (!reference) {
      return NextResponse.json({ error: 'Справочник не найден' }, { status: 404 });
    }

    await prisma.reference.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reference delete error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
