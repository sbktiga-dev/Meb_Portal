import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { verifyToken } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
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

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Файл слишком большой (макс. 10MB)' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Недопустимый формат файла' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const magicBytes = buffer.slice(0, 8);
    const isJpeg = magicBytes[0] === 0xFF && magicBytes[1] === 0xD8 && magicBytes[2] === 0xFF;
    const isPng = magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4E && magicBytes[3] === 0x47;
    const isGif = magicBytes[0] === 0x47 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46;
    const isWebp = magicBytes[0] === 0x52 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46 && magicBytes[3] === 0x46;

    if (!isJpeg && !isPng && !isGif && !isWebp) {
      return NextResponse.json({ error: 'Файл не является изображением' }, { status: 400 });
    }

    const ext = isJpeg ? 'jpg' : isPng ? 'png' : isGif ? 'gif' : 'webp';
    const disallowedExt = ['svg', 'html', 'htm', 'php', 'js', 'exe', 'bat', 'cmd', 'sh', 'ps1'];
    const originalExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (disallowedExt.includes(originalExt)) {
      return NextResponse.json({ error: 'Недопустимое расширение файла' }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({ url }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
