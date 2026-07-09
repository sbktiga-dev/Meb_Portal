import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';

// Run cleanup at most once every 5 minutes
let lastCleanup = 0;
const CLEANUP_INTERVAL = 5 * 60 * 1000;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;

    const now = new Date();

    // Periodic cleanup instead of every request
    if (Date.now() - lastCleanup > CLEANUP_INTERVAL) {
      lastCleanup = Date.now();
      const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      await prisma.event.deleteMany({
        where: {
          OR: [
            { endDate: { not: null, lt: cutoff } },
            { AND: [{ endDate: null }, { startDate: { lt: cutoff } }] },
          ],
        },
      }).catch(() => {});
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          organizer: { select: { id: true, name: true, avatar: true } },
          _count: { select: { participants: true } },
        },
        orderBy: [
          { startDate: 'asc' },
        ],
      }),
      prisma.event.count({ where }),
    ]);

    const active = events.filter(e => {
      const end = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
      return end >= now;
    });
    const past = events.filter(e => {
      const end = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
      return end < now;
    });
    const sorted = [...active, ...past];

    const res = NextResponse.json({
      events: sorted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
    if (!type) {
      res.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    }
    return res;
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, coverImage, location, startDate, endDate, type, maxParticipants } = body;

    if (!title || !startDate) {
      return NextResponse.json({ error: 'Название и дата обязательны' }, { status: 400 });
    }

    if (title.trim().length > 200) {
      return NextResponse.json({ error: 'Название не может превышать 200 символов' }, { status: 400 });
    }

    if (description && description.trim().length > 5000) {
      return NextResponse.json({ error: 'Описание не может превышать 5000 символов' }, { status: 400 });
    }

    const validEventTypes = ['offline', 'online', 'webinar'];
    const eventType = validEventTypes.includes(type) ? type : 'offline';
    const maxP = typeof maxParticipants === 'number' && maxParticipants > 0 ? Math.floor(maxParticipants) : null;

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        coverImage: coverImage || null,
        location: location?.trim() || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        type: eventType,
        maxParticipants: maxP,
        organizerId: user.id,
        participants: {
          create: { userId: user.id, status: 'organizer' },
        },
      },
      include: {
        organizer: { select: { id: true, name: true, avatar: true } },
        _count: { select: { participants: true } },
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
