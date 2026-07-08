export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: { products: true, users: { select: { id: true }, take: 1 } },
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Поставщик не найден' }, { status: 404 });
    }

    return NextResponse.json({
      supplier: {
        ...supplier,
        categories: JSON.parse(supplier.categories as string),
        userId: supplier.users?.[0]?.id || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { getUserFromToken } = await import('@/lib/auth');
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: { users: { select: { id: true } } },
    });
    if (!supplier) {
      return NextResponse.json({ error: 'Поставщик не найден' }, { status: 404 });
    }

    const isOwner = supplier.users.some(u => u.id === user.id);
    if (!isOwner && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const body = await request.json();
    const { logo, companyName, description, website, phone, email, categories } = body;

    const updated = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        ...(logo !== undefined && { logo: logo || null }),
        ...(companyName !== undefined && { companyName }),
        ...(description !== undefined && { description: description || null }),
        ...(website !== undefined && { website: website || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(categories !== undefined && { categories: JSON.stringify(categories) }),
      },
    });

    return NextResponse.json({ supplier: updated });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { getUserFromToken } = await import('@/lib/auth');
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const supplier = await prisma.supplier.findUnique({ where: { id: params.id } });
    if (!supplier) {
      return NextResponse.json({ error: 'Поставщик не найден' }, { status: 404 });
    }

    await prisma.supplier.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
