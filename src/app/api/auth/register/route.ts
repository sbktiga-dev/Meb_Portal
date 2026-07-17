import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { rateLimit, getClientIp, checkDualRateLimit } from '@/lib/rateLimit';
import { validateRequest, registerSchema } from '@/lib/validations';
import { sendEmail, verificationEmailHtml } from '@/lib/email';
import { logActivity } from '@/lib/activity';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const validation = validateRequest(registerSchema, body);

    const emailForLimit = validation.success ? validation.data.email : undefined;
    const { allowed, resetAt } = checkDualRateLimit(ip, emailForLimit, 'register', 5, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Слишком много регистраций. Попробуйте через минуту.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      );
    }

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email, password, name } = validation.data;

    // Validate Russian email domains
    const allowedDomains = [
      'yandex.ru', 'yandex.ua', 'yandex.by', 'yandex.kz',
      'mail.ru', 'inbox.ru', 'list.ru', 'bk.ru', 'rambler.ru',
      'gmail.com', 'googlemail.com',
      'outlook.com', 'hotmail.com', 'live.ru', 'live.com',
      'icloud.com', 'me.com',
      'yahoo.com', 'yahoo.ru',
      'protonmail.com', 'proton.me',
      'zoho.com',
      'icq.com',
      '1rambler.ru', 'autorambler.ru',
    ];
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      return NextResponse.json({
        error: 'Допустимые домены: yandex.ru, mail.ru, bk.ru, rambler.ru, gmail.com, outlook.com и другие российские почтовые сервисы'
      }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Пользователь уже существует' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const allowedRoles = ['CLIENT', 'USER', 'COMPANY', 'SUPPLIER', 'MANUFACTURER'];
    const userRole = (body.role && allowedRoles.includes(body.role)) ? body.role : 'USER';

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
          role: userRole,
          inn: body.inn || null,
        },
        select: { id: true, email: true, name: true, role: true, inn: true },
      });

      // Generate unique referral code for new user
      const referralCode = `MP-${u.id.slice(-8).toUpperCase()}`;
      await tx.user.update({ where: { id: u.id }, data: { referralCode } });

      // Handle referral if code provided
      if (body.referralCode) {
        const referrer = await tx.user.findUnique({ where: { referralCode: body.referralCode } });
        if (referrer && referrer.id !== u.id) {
          await tx.referral.create({
            data: { referrerId: referrer.id, referredId: u.id },
          });
        }
      }

      if (userRole === 'COMPANY') {
        const company = await tx.company.create({
          data: { name: name || email.split('@')[0] },
        });
        await tx.user.update({ where: { id: u.id }, data: { companyId: company.id } });
      } else if (userRole === 'SUPPLIER') {
        const supplier = await tx.supplier.create({
          data: { companyName: name || email.split('@')[0] },
        });
        await tx.user.update({ where: { id: u.id }, data: { supplierId: supplier.id } });
      } else if (userRole === 'MANUFACTURER') {
        const manufacturer = await tx.manufacturer.create({
          data: { name: name || email.split('@')[0] },
        });
        await tx.user.update({ where: { id: u.id }, data: { manufacturerId: manufacturer.id } });
      } else if (userRole === 'USER') {
        const specialistType = body.specialistType || 'DESIGNER';
        const allowedTypes = ['DESIGNER', 'TECHNOLOGIST', 'INSTALLER', 'MANAGER'];
        const specType = allowedTypes.includes(specialistType) ? specialistType : 'DESIGNER';
        const specialist = await tx.specialist.create({
          data: { type: specType },
        });
        await tx.user.update({ where: { id: u.id }, data: { specialistId: specialist.id } });
      }

      return u;
    });

    // Send verification email (optional - user can verify later from profile)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({ where: { id: user.id }, data: { verificationToken } });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Подтверждение email — МебПортал',
      html: verificationEmailHtml(user.name || 'Пользователь', verificationUrl),
    }).catch(() => false);

    logActivity({ action: 'register', userId: user.id, details: `Регистрация: ${user.email} (${userRole})` });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
      message: 'Регистрация успешна',
    });
  } catch (error) {
    console.error('Register error:', error instanceof Error ? error.message : 'Unknown');
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
