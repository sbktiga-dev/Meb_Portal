import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { validateRequest, registerSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed, resetAt } = rateLimit(`register:${ip}`, 5, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много регистраций. Попробуйте через минуту.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await req.json();
    const validation = validateRequest(registerSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email, password, name } = validation.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Пользователь уже существует' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const allowedRoles = ['CLIENT', 'USER', 'COMPANY', 'SUPPLIER', 'MANUFACTURER'];
    const userRole = (body.role && allowedRoles.includes(body.role)) ? body.role : 'USER';

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: userRole,
        inn: body.inn || null,
      },
      select: { id: true, email: true, name: true, role: true, inn: true },
    });

    let businessId: string | null = null;

    if (userRole === 'COMPANY') {
      const company = await prisma.company.create({
        data: { name: name || email.split('@')[0] },
      });
      await prisma.user.update({ where: { id: user.id }, data: { companyId: company.id } });
      businessId = company.id;
    } else if (userRole === 'SUPPLIER') {
      const supplier = await prisma.supplier.create({
        data: { companyName: name || email.split('@')[0] },
      });
      await prisma.user.update({ where: { id: user.id }, data: { supplierId: supplier.id } });
      businessId = supplier.id;
    } else if (userRole === 'MANUFACTURER') {
      const manufacturer = await prisma.manufacturer.create({
        data: { name: name || email.split('@')[0] },
      });
      await prisma.user.update({ where: { id: user.id }, data: { manufacturerId: manufacturer.id } });
      businessId = manufacturer.id;
    } else if (userRole === 'USER') {
      const specialistType = body.specialistType || 'DESIGNER';
      const allowedTypes = ['DESIGNER', 'TECHNOLOGIST', 'INSTALLER', 'MANAGER'];
      const specType = allowedTypes.includes(specialistType) ? specialistType : 'DESIGNER';
      const specialist = await prisma.specialist.create({
        data: { type: specType },
      });
      await prisma.user.update({ where: { id: user.id }, data: { specialistId: specialist.id } });
      businessId = specialist.id;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ user: { ...user, businessId }, token });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
