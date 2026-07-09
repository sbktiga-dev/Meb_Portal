import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const style = formData.get('style') as string;
    const category = formData.get('category') as string;
    const tags = formData.get('tags') as string;
    const file = formData.get('file') as File;

    if (!title || !file) {
      return NextResponse.json({ error: 'Обязательные поля не заполнены' }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Допустимые форматы: JPEG, PNG, GIF, WebP' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Файл не должен превышать 10MB' }, { status: 400 });
    }

    // Validate magic bytes
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 4));
    const validMagic: Record<string, number[]> = {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
    };
    const magic = validMagic[file.type];
    if (magic && !magic.every((b, i) => bytes[i] === b)) {
      return NextResponse.json({ error: 'Файл повреждён или не соответствует типу' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(`gallery/${filename}`, file, {
      access: 'public',
    });

    const image = await prisma.image.create({
      data: {
        title,
        description: description || null,
        url: blob.url,
        thumbnail: blob.url,
        style: style || null,
        category: category || null,
        tags: tags ? JSON.stringify(tags.split(',').map((t) => t.trim())) : '[]',
      },
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
