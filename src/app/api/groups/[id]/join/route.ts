export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

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

    const group = await prisma.group.findUnique({ where: { id: params.id } });
    if (!group) {
      return NextResponse.json({ error: 'Группа не найдена' }, { status: 404 });
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: params.id } },
    });

    if (existingMember) {
      if (group.ownerId === user.id) {
        return NextResponse.json({ error: 'Владелец не может покинуть группу' }, { status: 400 });
      }
      await prisma.groupMember.delete({
        where: { userId_groupId: { userId: user.id, groupId: params.id } },
      });
      logActivity({ action: 'group_leave', userId: user.id, details: `Выход из группы ${params.id}` });
      return NextResponse.json({ joined: false });
    }

    await prisma.groupMember.create({
      data: { userId: user.id, groupId: params.id, role: 'member' },
    });
    logActivity({ action: 'group_join', userId: user.id, details: `Вступление в группу ${params.id}` });

    if (user.id !== group.ownerId) {
      await prisma.notification.create({
        data: {
          type: 'group_join',
          message: `${user.name || 'Пользователь'} вступил в группу`,
          link: `/groups/${params.id}`,
          userId: group.ownerId,
          fromUserId: user.id,
        },
      });
    }

    return NextResponse.json({ joined: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
