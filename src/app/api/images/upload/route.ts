import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

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

    // In production, upload file to S3/MinIO and save URL
    const mockUrl = `/uploads/${Date.now()}-${file.name}`;

    const image = await prisma.image.create({
      data: {
        title,
        description: description || null,
        url: mockUrl,
        thumbnail: mockUrl,
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
