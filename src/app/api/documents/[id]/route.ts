export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

const RESTRICTED_CATEGORIES = ['Договоры', 'Акты', 'ТЗ'];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Документ не найден' }, { status: 404 });
    }

    const authHeader = request.headers.get('authorization');
    const isDownload = authHeader?.startsWith('Bearer ');

    if (isDownload) {
      const token = authHeader!.split(' ')[1];
      const user = await getUserFromToken(token);

      if (!user) {
        return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
      }

      if (user.role === 'CLIENT' && RESTRICTED_CATEGORIES.includes(document.category)) {
        return NextResponse.json({ error: 'Нет доступа к этому документу' }, { status: 403 });
      }

      try {
        await prisma.document.update({
          where: { id: params.id },
          data: { downloads: { increment: 1 } },
        });
      } catch (e) {
        console.error('Document download count update error:', e);
      }
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user || user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Документ не найден' }, { status: 404 });
    }

    await prisma.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document delete error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
