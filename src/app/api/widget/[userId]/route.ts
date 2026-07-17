export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        company: {
          select: { name: true, description: true, logo: true },
        },
        supplier: {
          select: { companyName: true, description: true, logo: true },
        },
        manufacturer: {
          select: { name: true, description: true, logo: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const displayName = user.company?.name || user.supplier?.companyName || user.manufacturer?.name || user.name || 'Пользователь';
    const description = user.company?.description || user.supplier?.description || user.manufacturer?.description || '';
    const logo = user.company?.logo || user.supplier?.logo || user.manufacturer?.logo || user.avatar;
    const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mebportal.online'}/profile/${user.id}`;

    const widgetHtml = `<!-- МебПортал Виджет -->
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:320px;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="padding:20px;text-align:center;">
    ${logo ? `<img src="${logo}" alt="${displayName}" style="width:64px;height:64px;border-radius:12px;object-fit:cover;margin-bottom:12px;" />` : `<div style="width:64px;height:64px;border-radius:12px;background:linear-gradient(135deg,#f97316,#eab308);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:#fff;font-size:24px;font-weight:bold;">${displayName.charAt(0)}</div>`}
    <h3 style="margin:0 0 4px;font-size:16px;font-weight:600;color:#111827;">${displayName}</h3>
    ${description ? `<p style="margin:0 0 12px;font-size:13px;color:#6b7280;line-height:1.4;">${description.slice(0, 100)}${description.length > 100 ? '...' : ''}</p>` : ''}
    <a href="${profileUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 24px;background:#f97316;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;transition:background 0.2s;" onmouseover="this.style.style='#ea580c'" onmouseout="this.style.background='#f97316'">
      Смотреть на МебПортале
    </a>
  </div>
  <div style="padding:8px 20px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
    <span style="font-size:11px;color:#9ca3af;">МебПортал — платформа для мебельщиков</span>
  </div>
</div>
<!-- /МебПортал Виджет -->`;

    const embedCode = `<iframe src="${process.env.NEXT_PUBLIC_APP_URL || 'https://mebportal.online'}/widget/${user.id}" width="320" height="200" frameborder="0" style="border:none;border-radius:16px;overflow:hidden;"></iframe>`;

    return NextResponse.json({
      widgetHtml,
      embedCode,
      profileUrl,
      displayName,
    });
  } catch (e) {
    console.error('Widget error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
