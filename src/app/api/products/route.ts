import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sort = searchParams.get('sort') || 'newest';
    const companyId = searchParams.get('companyId');
    const supplierId = searchParams.get('supplierId');
    const manufacturerId = searchParams.get('manufacturerId');

    const where: Record<string, unknown> = { isPublished: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } },
      ];
    }
    if (category) where.category = category;
    if (brand) where.brand = brand;
    if (companyId) where.companyId = companyId;
    if (supplierId) where.supplierId = supplierId;
    if (manufacturerId) where.manufacturerId = manufacturerId;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice);
      if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice);
    }
    if (minRating) {
      const productIds = await prisma.productReview.groupBy({
        by: ['productId'],
        where: { score: { gte: parseFloat(minRating) } },
        _avg: { score: true },
        having: { score: { _avg: { gte: parseFloat(minRating) } } },
      });
      where.id = { in: productIds.map(p => p.productId) };
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Record<string, Date>).lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const orderBy = sort === 'popular'
      ? { views: 'desc' as const }
      : sort === 'price_asc'
        ? { price: 'asc' as const }
        : sort === 'price_desc'
          ? { price: 'desc' as const }
          : sort === 'name'
            ? { name: 'asc' as const }
            : { createdAt: 'desc' as const };

    // Get active boosts for sorting
    const activeBoosts = await prisma.productBoost.findMany({
      where: { active: true, budget: { gt: prisma.productBoost.fields.spent } },
      select: { productId: true, costPerClick: true },
      orderBy: { costPerClick: 'desc' },
    });
    const boostedIds = new Set(activeBoosts.map(b => b.productId));
    const boostOrder = new Map(activeBoosts.map((b, i) => [b.productId, i]));

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          company: { select: { id: true, name: true, logo: true } },
          supplier: { select: { id: true, companyName: true, logo: true } },
          manufacturer: { select: { id: true, name: true, logo: true } },
          boost: { select: { costPerClick: true, clicks: true, active: true } },
          _count: { select: { reviews: true } },
        },
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    // Sort: boosted first (by costPerClick desc), then normal
    products.sort((a, b) => {
      const aBoosted = boostedIds.has(a.id);
      const bBoosted = boostedIds.has(b.id);
      if (aBoosted && !bBoosted) return -1;
      if (!aBoosted && bBoosted) return 1;
      if (aBoosted && bBoosted) return (boostOrder.get(a.id) || 0) - (boostOrder.get(b.id) || 0);
      return 0;
    });

    const ratings = await prisma.productReview.groupBy({
      by: ['productId'],
      where: { productId: { in: products.map(p => p.id) } },
      _avg: { score: true },
    });
    const ratingMap = new Map(ratings.map(r => [r.productId, r._avg.score || 0]));

    const productsWithRating = products.map(p => ({
      ...p,
      avgRating: ratingMap.get(p.id) || 0,
      isBoosted: boostedIds.has(p.id),
    }));

    const res = NextResponse.json({
      products: productsWithRating,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
    if (!search && !brand) {
      res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    }
    return res;
  } catch (e) {
    console.error('Products GET error:', e);
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
    const { name, description, price, category, brand, images, specs } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Название и категория обязательны' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        price: price ? parseFloat(price) : null,
        category,
        brand: brand || null,
        images: images ? JSON.stringify(images) : '[]',
        specs: specs ? JSON.stringify(specs) : '[]',
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (e) {
    console.error('Products POST error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
