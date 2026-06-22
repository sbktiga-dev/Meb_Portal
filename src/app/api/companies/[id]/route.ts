import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: { users: { select: { id: true }, take: 1 } },
    });

    if (!company) {
      return NextResponse.json({ error: 'Компания не найдена' }, { status: 404 });
    }

    return NextResponse.json({
      company: {
        ...company,
        userId: company.users?.[0]?.id || null,
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

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: { users: { select: { id: true } } },
    });
    if (!company) {
      return NextResponse.json({ error: 'Компания не найдена' }, { status: 404 });
    }

    const isOwner = company.users.some(u => u.id === user.id);
    if (!isOwner && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const body = await request.json();
    const { logo, name, description, website, phone, email, address } = body;

    const updated = await prisma.company.update({
      where: { id: params.id },
      data: {
        ...(logo !== undefined && { logo: logo || null }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(website !== undefined && { website: website || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(address !== undefined && { address: address || null }),
      },
    });

    return NextResponse.json({ company: updated });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
