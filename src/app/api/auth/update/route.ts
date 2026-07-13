import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken, hashPassword, verifyPassword } from '@/lib/auth';
import { validateRequest, updateProfileSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity';

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await req.json();
    const validation = validateRequest(updateProfileSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, phone, inn, avatar, cover, bio, location, website, socialLinks, profileBanners, profileTheme } = validation.data;

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? phone : undefined,
        inn: inn !== undefined ? inn : undefined,
        avatar: avatar !== undefined ? avatar : undefined,
        cover: cover !== undefined ? cover : undefined,
        bio: bio !== undefined ? bio : undefined,
        location: location !== undefined ? location : undefined,
        website: website !== undefined ? website : undefined,
        socialLinks: socialLinks !== undefined ? socialLinks : undefined,
        profileBanners: profileBanners !== undefined && profileBanners !== null ? profileBanners : undefined,
        profileTheme: profileTheme !== undefined && profileTheme !== null ? profileTheme : undefined,
      },
      select: { id: true, email: true, name: true, role: true, inn: true, phone: true, avatar: true, cover: true, bio: true, location: true, website: true, socialLinks: true, profileBanners: true, profileTheme: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Новый пароль минимум 6 символов' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Неверный текущий пароль' }, { status: 401 });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: payload.userId },
      data: { password: hashedPassword },
    });

    logActivity({ action: 'password_change', userId: payload.userId, details: 'Смена пароля' });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
