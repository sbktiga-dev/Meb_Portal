import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: { select: { members: true, posts: true } },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const group = await prisma.group.findUnique({
      where: { id: params.id },
      include: { members: { where: { userId: user.id, role: 'admin' } } },
    });

    if (!group || group.members.length === 0) {
      return NextResponse.json({ error: 'Нет прав на редактирование' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, coverImage, type } = body;

    const updated = await prisma.group.update({
      where: { id: params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(coverImage !== undefined && { coverImage }),
        ...(type && { type }),
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true, posts: true } },
      },
    });

    return NextResponse.json({ group: updated });
  } catch {
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

    const group = await prisma.group.findUnique({ where: { id: params.id } });
    if (!group) {
      return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 });
    }

    if (group.ownerId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет прав на удаление' }, { status: 403 });
    }

    await prisma.group.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
