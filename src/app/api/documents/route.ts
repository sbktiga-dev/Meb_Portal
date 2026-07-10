import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { sanitizeInput } from '@/lib/validation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const sort = searchParams.get('sort') || 'newest';

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy = sort === 'popular'
      ? { downloads: 'desc' as const }
      : sort === 'title'
        ? { title: 'asc' as const }
        : { createdAt: 'desc' as const };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.document.count({ where }),
    ]);

    const res = NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    if (!category && !search) {
      res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    }
    return res;
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const ip = getClientIp(request as Parameters<typeof getClientIp>[0]);
    const { allowed, resetAt } = rateLimit(`doc:${user.id}:${ip}`, 10, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много загрузок. Попробуйте через минуту.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const { title, description, fileUrl, fileName, fileSize, category, fileType } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Название обязательно' }, { status: 400 });
    }

    if (!fileUrl) {
      return NextResponse.json({ error: 'URL файла обязателен' }, { status: 400 });
    }

    const allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (fileType && !allowedDocTypes.includes(fileType)) {
      return NextResponse.json({
        error: 'Недопустимый формат. Разрешены: PDF, DOC, DOCX, XLS, XLSX',
      }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        title: sanitizeInput(title.trim()),
        description: description ? sanitizeInput(description.trim()) : null,
        fileUrl,
        fileName: fileName || null,
        fileSize: fileSize || null,
        category: category || 'general',
        fileType: fileType || 'application/pdf',
        userId: user.id,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Document create error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
