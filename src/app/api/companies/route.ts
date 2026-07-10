import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { PLAN_PRO, PLAN_PREMIUM, ROLE_ADMIN } from '@/lib/constants';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const sort = searchParams.get('sort') || 'newest';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { address: { contains: search } },
      ];
    }

    const orderBy = sort === 'verified'
      ? { isVerified: 'desc' as const }
      : sort === 'name'
        ? { name: 'asc' as const }
        : { createdAt: 'desc' as const };

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { products: true } },
          users: { select: { id: true, name: true, avatar: true } },
        },
        orderBy,
      }),
      prisma.company.count({ where }),
    ]);

    // Get Pro/Premium user IDs for priority sorting
    const userIds = companies.flatMap(c => c.users.map(u => u.id));
    const proSubscriptions = await prisma.subscription.findMany({
      where: { userId: { in: userIds }, status: 'active', plan: { in: [PLAN_PRO, PLAN_PREMIUM] } },
      select: { userId: true, plan: true },
    });
    const proUserIds = new Set(proSubscriptions.map(s => s.userId));
    const premiumUserIds = new Set(proSubscriptions.filter(s => s.plan === PLAN_PREMIUM).map(s => s.userId));

    const parsed = companies.map((c) => ({
      ...c,
      avatar: c.users?.[0]?.avatar || null,
      displayName: c.users?.[0]?.name || c.name,
      userId: c.users?.[0]?.id || null,
      isPro: c.users?.[0]?.id ? proUserIds.has(c.users[0].id) : false,
      isPremium: c.users?.[0]?.id ? premiumUserIds.has(c.users[0].id) : false,
    }));

    // Sort: Premium first, then Pro, then others
    parsed.sort((a, b) => (b.isPremium ? 2 : b.isPro ? 1 : 0) - (a.isPremium ? 2 : a.isPro ? 1 : 0));

    const res = NextResponse.json({
      companies: parsed,
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
    if (!user || user.role !== ROLE_ADMIN) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, address, phone, email, website } = body;

    if (!name) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name,
        description: description || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
      },
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (e) {
    console.error('Companies POST error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
