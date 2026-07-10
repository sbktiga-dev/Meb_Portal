export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const manufacturer = await prisma.manufacturer.findUnique({
      where: { id: params.id },
      include: { users: { select: { id: true }, take: 1 } },
    });

    if (!manufacturer) {
      return NextResponse.json({ error: 'Производство не найдено' }, { status: 404 });
    }

    return NextResponse.json({
      manufacturer: {
        ...manufacturer,
        capabilities: JSON.parse(manufacturer.capabilities as string),
        userId: manufacturer.users?.[0]?.id || null,
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

    const manufacturer = await prisma.manufacturer.findUnique({
      where: { id: params.id },
      include: { users: { select: { id: true } } },
    });
    if (!manufacturer) {
      return NextResponse.json({ error: 'Производство не найдено' }, { status: 404 });
    }

    const isOwner = manufacturer.users.some(u => u.id === user.id);
    if (!isOwner && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const body = await request.json();
    const { logo, name, description, website, phone, email, address, capabilities, geometry } = body;

    const updated = await prisma.manufacturer.update({
      where: { id: params.id },
      data: {
        ...(logo !== undefined && { logo: logo || null }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(website !== undefined && { website: website || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(address !== undefined && { address: address || null }),
        ...(capabilities !== undefined && { capabilities: JSON.stringify(capabilities) }),
        ...(geometry !== undefined && { geometry: geometry || null }),
      },
    });

    return NextResponse.json({ manufacturer: updated });
  } catch (e) {
    console.error('Manufacturer PUT error:', e);
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

    const manufacturer = await prisma.manufacturer.findUnique({ where: { id: params.id } });
    if (!manufacturer) {
      return NextResponse.json({ error: 'Производство не найдено' }, { status: 404 });
    }

    await prisma.manufacturer.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Manufacturer DELETE error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
