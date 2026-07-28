export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/auth';
import { testConnection } from '@/lib/amoCRM';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const integration = await prisma.integration.findUnique({ where: { type: 'amocrm' } });
    if (!integration) {
      return NextResponse.json({ integration: null });
    }

    const config = JSON.parse(integration.config || '{}');
    return NextResponse.json({
      integration: {
        id: integration.id,
        type: integration.type,
        enabled: integration.enabled,
        domain: config.domain || '',
        client_id: config.client_id || '',
        pipeline_id: config.pipeline_id || 0,
        status_id: config.status_id || 0,
        hasTokens: !!(config.access_token && config.refresh_token),
      },
    });
  } catch (e) {
    console.error('Integrations GET error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const body = await request.json();
    const { domain, client_id, client_secret, access_token, refresh_token, pipeline_id, status_id, enabled } = body;

    const existing = await prisma.integration.findUnique({ where: { type: 'amocrm' } });
    const currentConfig = existing ? JSON.parse(existing.config || '{}') : {};

    const newConfig = {
      domain: domain || currentConfig.domain || '',
      client_id: client_id || currentConfig.client_id || '',
      client_secret: client_secret || currentConfig.client_secret || '',
      access_token: access_token || currentConfig.access_token || '',
      refresh_token: refresh_token || currentConfig.refresh_token || '',
      pipeline_id: pipeline_id || currentConfig.pipeline_id || 0,
      status_id: status_id || currentConfig.status_id || 0,
      expires_at: currentConfig.expires_at || 0,
    };

    await prisma.integration.upsert({
      where: { type: 'amocrm' },
      update: { config: JSON.stringify(newConfig), enabled: enabled !== undefined ? enabled : existing?.enabled ?? false },
      create: { type: 'amocrm', config: JSON.stringify(newConfig), enabled: enabled || false },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Integrations POST error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const user = await getUserFromToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
    }

    const result = await testConnection();
    return NextResponse.json(result);
  } catch (e) {
    console.error('Integrations PATCH error:', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
