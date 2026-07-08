import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { verifyToken } from '@/lib/auth';
import { put } from '@vercel/blob';
import { rateLimit, getClientIp, USER_QUOTAS } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES, ...ALLOWED_VIDEO_TYPES];

function isImage(type: string) { return ALLOWED_IMAGE_TYPES.includes(type); }
function isDocument(type: string) { return ALLOWED_DOC_TYPES.includes(type); }
function isVideo(type: string) { return ALLOWED_VIDEO_TYPES.includes(type); }

function getFileCategory(type: string): 'image' | 'document' | 'video' {
  if (isImage(type)) return 'image';
  if (isDocument(type)) return 'document';
  return 'video';
}

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

    // Rate limit: 20 загрузок/мин на IP
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

    // Проверка типа файла
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Недопустимый формат. Разрешены: JPG, PNG, GIF, WebP, PDF, DOC, DOCX, XLS, XLSX, MP4',
      }, { status: 400 });
    }

    // Проверка размера
    const category = getFileCategory(file.type);
    const maxSizes: Record<string, number> = {
      image: 10 * 1024 * 1024,    // 10MB
      document: 20 * 1024 * 1024,  // 20MB
      video: 50 * 1024 * 1024,     // 50MB
    };
    const maxSize = maxSizes[category] || 10 * 1024 * 1024;

    if (file.size > maxSize) {
      const sizeMB = Math.round(maxSize / 1024 / 1024);
      return NextResponse.json({
        error: `Файл слишком большой (макс. ${sizeMB}MB)`,
      }, { status: 400 });
    }

    // Проверка квоты пользователя
    const userFileCount = await prisma.download.count({
      where: { userId: user.id },
    }).catch(() => 0);

    // Подсчёт загруженных файлов пользователя (через post images + portfolio images)
    const userPosts = await prisma.post.findMany({
      where: { authorId: user.id },
      select: { images: true },
    });
    const userPortfolio = await prisma.portfolioItem.findMany({
      where: { userId: user.id },
      select: { images: true },
    });

    let uploadedImageCount = 0;
    for (const post of userPosts) {
      try { uploadedImageCount += JSON.parse(post.images).length; } catch {}
    }
    for (const item of userPortfolio) {
      try { uploadedImageCount += JSON.parse(item.images).length; } catch {}
    }

    if (category === 'image' && uploadedImageCount >= USER_QUOTAS.maxImagesPerUser) {
      return NextResponse.json({
        error: `Достигнут лимит изображений (${USER_QUOTAS.maxImagesPerUser}). Удалите старые файлы.`,
      }, { status: 400 });
    }

    if (uploadedImageCount >= USER_QUOTAS.maxFilesPerUser) {
      return NextResponse.json({
        error: `Достигнут лимит файлов (${USER_QUOTAS.maxFilesPerUser}). Удалите старые файлы.`,
      }, { status: 400 });
    }

    // Загрузка
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(`uploads/${filename}`, file, {
      access: 'public',
    });

    return NextResponse.json({
      url: blob.url,
      category,
      filename: file.name,
      size: file.size,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
