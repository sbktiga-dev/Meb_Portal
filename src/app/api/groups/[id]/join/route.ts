export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

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
      await prisma.groupMember.delete({
        where: { userId_groupId: { userId: user.id, groupId: params.id } },
      });
      return NextResponse.json({ joined: false });
    }

    await prisma.groupMember.create({
      data: { userId: user.id, groupId: params.id, role: 'member' },
    });

    return NextResponse.json({ joined: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
