import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [manufacturers, total] = await Promise.all([
      prisma.manufacturer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          users: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.manufacturer.count({ where }),
    ]);

    const parsed = manufacturers.map((m) => ({
      ...m,
      capabilities: JSON.parse(m.capabilities as string),
      avatar: m.users?.[0]?.avatar || null,
      displayName: m.users?.[0]?.name || m.name,
    }));

    const res = NextResponse.json({
      manufacturers: parsed,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    if (!search) {
      res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    }
    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const { verifyToken } = await import('@/lib/auth');
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, address, phone, email, website, capabilities, geometry } = body;

    if (!name) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    }

    const manufacturer = await prisma.manufacturer.create({
      data: {
        name,
        description: description || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        capabilities: capabilities ? JSON.stringify(capabilities) : '[]',
        geometry: geometry || null,
      },
    });

    return NextResponse.json({ manufacturer }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
