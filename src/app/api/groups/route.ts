import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
          _count: { select: { members: true, posts: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.group.count({ where }),
    ]);

    const res = NextResponse.json({
      groups,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
    if (!search) {
      res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    }
    return res;
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { name, description, type } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Название не может превышать 100 символов' }, { status: 400 });
    }

    if (description && description.trim().length > 2000) {
      return NextResponse.json({ error: 'Описание не может превышать 2000 символов' }, { status: 400 });
    }

    const validTypes = ['public', 'private'];
    const groupType = validTypes.includes(type) ? type : 'public';

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        type: groupType,
        ownerId: user.id,
        members: {
          create: { userId: user.id, role: 'admin' },
        },
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { members: true, posts: true } },
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
