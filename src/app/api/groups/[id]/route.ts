export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const currentUser = token ? await getUserFromToken(token) : null;

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

    if (group.type === 'private') {
      const isMember = currentUser && group.members.some(m => m.userId === currentUser.id);
      const isOwner = currentUser && group.ownerId === currentUser.id;
      const isAdmin = currentUser?.role === 'ADMIN';
      if (!isMember && !isOwner && !isAdmin) {
        return NextResponse.json({
          group: {
            ...group,
            members: [],
            _count: group._count,
          },
        });
      }
    }

    return NextResponse.json({ group });
  } catch (e) {
    console.error('Error:', e);
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

    if (name && name.length > 100) {
      return NextResponse.json({ error: 'Название не может превышать 100 символов' }, { status: 400 });
    }

    if (description && description.length > 2000) {
      return NextResponse.json({ error: 'Описание не может превышать 2000 символов' }, { status: 400 });
    }

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
  } catch (e) {
    console.error('Error:', e);
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

    const [postsCount, membersCount] = await Promise.all([
      prisma.groupPost.count({ where: { groupId: params.id } }),
      prisma.groupMember.count({ where: { groupId: params.id } }),
    ]);
    if (postsCount > 0) {
      return NextResponse.json({ error: 'Нельзя удалить группу с постами. Сначала удалите все посты.' }, { status: 400 });
    }
    if (membersCount > 1) {
      return NextResponse.json({ error: 'Нельзя удалить группу с участниками. Сначала удалите всех участников.' }, { status: 400 });
    }

    await prisma.groupMember.deleteMany({ where: { groupId: params.id } });
    await prisma.group.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
