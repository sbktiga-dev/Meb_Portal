import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { verifyToken } from '@/lib/auth';
import { put } from '@vercel/blob';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const ip = getClientIp(request as Parameters<typeof getClientIp>[0]);
    const { allowed, resetAt } = rateLimit(`upload:${ip}`, 20, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много загрузок. Попробуйте через минуту.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не выбран' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Недопустимый формат файла' }, { status: 400 });
    }

    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: isVideo ? 'Видео слишком большое (макс. 50MB)' : 'Файл слишком большой (макс. 10MB)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(`uploads/${filename}`, file, {
      access: 'public',
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
