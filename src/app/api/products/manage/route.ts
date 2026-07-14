export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { sanitizeInput } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Find user's company/supplier/manufacturer
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        companyId: true,
        supplierId: true,
        manufacturerId: true,
      },
    });

    if (!fullUser?.companyId && !fullUser?.supplierId && !fullUser?.manufacturerId) {
      return NextResponse.json({ error: 'Нет привязки к компании/производству' }, { status: 400 });
    }

    const where: Record<string, unknown> = {};
    if (fullUser.companyId) where.companyId = fullUser.companyId;
    if (fullUser.supplierId) where.supplierId = fullUser.supplierId;
    if (fullUser.manufacturerId) where.manufacturerId = fullUser.manufacturerId;

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { reviews: true } },
      },
    });

    return NextResponse.json({ products });
  } catch (e) {
    console.error('Products manage GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        companyId: true,
        supplierId: true,
        manufacturerId: true,
      },
    });

    if (!fullUser?.companyId && !fullUser?.supplierId && !fullUser?.manufacturerId) {
      return NextResponse.json({ error: 'Нет привязки к компании/производству' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, price, images, category, brand, specs } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: 'Категория обязательна' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: sanitizeInput(name.trim()),
        description: description ? sanitizeInput(description.trim()) : null,
        price: price ? parseFloat(price) : null,
        images: JSON.stringify(images || []),
        category,
        brand: brand ? sanitizeInput(brand.trim()) : null,
        specs: JSON.stringify(specs || []),
        companyId: fullUser.companyId,
        supplierId: fullUser.supplierId,
        manufacturerId: fullUser.manufacturerId,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (e) {
    console.error('Product create error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, price, images, category, brand, specs, isPublished } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID товара обязателен' }, { status: 400 });
    }

    // Check ownership
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { companyId: true, supplierId: true, manufacturerId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true, supplierId: true, manufacturerId: true },
    });

    const isOwner =
      (existing.companyId && existing.companyId === fullUser?.companyId) ||
      (existing.supplierId && existing.supplierId === fullUser?.supplierId) ||
      (existing.manufacturerId && existing.manufacturerId === fullUser?.manufacturerId) ||
      user.role === 'ADMIN';

    if (!isOwner) {
      return NextResponse.json({ error: 'Нет прав на редактирование' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = sanitizeInput(name.trim());
    if (description !== undefined) updateData.description = description ? sanitizeInput(description.trim()) : null;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null;
    if (images !== undefined) updateData.images = JSON.stringify(images);
    if (category !== undefined) updateData.category = category;
    if (brand !== undefined) updateData.brand = brand ? sanitizeInput(brand.trim()) : null;
    if (specs !== undefined) updateData.specs = JSON.stringify(specs);
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ product });
  } catch (e) {
    console.error('Product update error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID товара обязателен' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { companyId: true, supplierId: true, manufacturerId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { companyId: true, supplierId: true, manufacturerId: true },
    });

    const isOwner =
      (existing.companyId && existing.companyId === fullUser?.companyId) ||
      (existing.supplierId && existing.supplierId === fullUser?.supplierId) ||
      (existing.manufacturerId && existing.manufacturerId === fullUser?.manufacturerId) ||
      user.role === 'ADMIN';

    if (!isOwner) {
      return NextResponse.json({ error: 'Нет прав на удаление' }, { status: 403 });
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Product delete error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
