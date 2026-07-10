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
        orderBy: [{ createdAt: 'desc' }],
        include: {
          users: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      prisma.manufacturer.count({ where }),
    ]);

    // Get Pro/Premium user IDs for priority sorting
    const userIds = manufacturers.flatMap(m => m.users.map(u => u.id));
    const proSubscriptions = await prisma.subscription.findMany({
      where: { userId: { in: userIds }, status: 'active', plan: { in: ['pro', 'premium'] } },
      select: { userId: true, plan: true },
    });
    const proUserIds = new Set(proSubscriptions.map(s => s.userId));
    const premiumUserIds = new Set(proSubscriptions.filter(s => s.plan === 'premium').map(s => s.userId));

    const parsed = manufacturers.map((m) => ({
      ...m,
      capabilities: JSON.parse(m.capabilities as string),
      avatar: m.users?.[0]?.avatar || null,
      displayName: m.users?.[0]?.name || m.name,
      userId: m.users?.[0]?.id || null,
      isPro: m.users?.[0]?.id ? proUserIds.has(m.users[0].id) : false,
      isPremium: m.users?.[0]?.id ? premiumUserIds.has(m.users[0].id) : false,
    }));

    // Sort: Premium first, then Pro, then others
    parsed.sort((a, b) => (b.isPremium ? 2 : b.isPro ? 1 : 0) - (a.isPremium ? 2 : a.isPro ? 1 : 0));

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
  } catch (e) {
    console.error('Manufacturers POST error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
