#!/bin/bash
cd /home/ubuntu/Meb_Portal

# Copy updated files
cp /tmp/admin_page.tsx src/app/admin/page.tsx
cp /tmp/admin_docs_page.tsx src/app/admin/documents/page.tsx
cp /tmp/refs_page.tsx src/app/refs/page.tsx
cp /tmp/refs_route.ts src/app/api/refs/route.ts
cp /tmp/docs_route.ts src/app/api/documents/route.ts
cp /tmp/docs_id_route.ts src/app/api/documents/\[id\]/route.ts

# Create refs [id] route if not exists
mkdir -p src/app/api/refs/\[id\]
cat > src/app/api/refs/\[id\]/route.ts << 'REOF'
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reference = await prisma.reference.findUnique({
      where: { id: params.id },
    });

    if (!reference) {
      return NextResponse.json({ error: 'Справочник не найден' }, { status: 404 });
    }

    let content: unknown;
    try {
      content = JSON.parse(reference.content as string);
    } catch {
      content = reference.content;
    }

    return NextResponse.json({ reference: { ...reference, content } });
  } catch (error) {
    console.error('Reference fetch error:', error);
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

    const reference = await prisma.reference.findUnique({
      where: { id: params.id },
    });

    if (!reference) {
      return NextResponse.json({ error: 'Справочник не найден' }, { status: 404 });
    }

    await prisma.reference.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reference delete error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
REOF

# Rebuild
pm2 stop mebportal
rm -rf .next
npm run build 2>&1 | tail -5
pm2 restart mebportal
sleep 3
pm2 status
