import { prisma } from './prisma';

interface AmoCRMConfig {
  domain: string;
  client_id: string;
  client_secret: string;
  access_token: string;
  refresh_token: string;
  pipeline_id: number;
  status_id: number;
  expires_at: number;
}

async function getConfig(): Promise<AmoCRMConfig | null> {
  const integration = await prisma.integration.findUnique({ where: { type: 'amocrm' } });
  if (!integration || !integration.enabled) return null;
  try {
    return JSON.parse(integration.config);
  } catch {
    return null;
  }
}

async function saveConfig(config: AmoCRMConfig): Promise<void> {
  await prisma.integration.upsert({
    where: { type: 'amocrm' },
    update: { config: JSON.stringify(config) },
    create: { type: 'amocrm', config: JSON.stringify(config), enabled: true },
  });
}

async function refreshToken(config: AmoCRMConfig): Promise<AmoCRMConfig> {
  const res = await fetch(`https://${config.domain}/oauth2/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.client_id,
      client_secret: config.client_secret,
      grant_type: 'refresh_token',
      refresh_token: config.refresh_token,
      redirect_uri: `https://${config.domain}`,
    }),
  });

  if (!res.ok) {
    throw new Error(`AmoCRM token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  const updated: AmoCRMConfig = {
    ...config,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in * 1000),
  };
  await saveConfig(updated);
  return updated;
}

async function apiRequest(config: AmoCRMConfig, method: string, path: string, body?: unknown): Promise<unknown> {
  let currentConfig = config;

  if (Date.now() >= currentConfig.expires_at - 60000) {
    currentConfig = await refreshToken(currentConfig);
  }

  const res = await fetch(`https://${currentConfig.domain}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentConfig.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    currentConfig = await refreshToken(currentConfig);
    const retryRes = await fetch(`https://${currentConfig.domain}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentConfig.access_token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!retryRes.ok) throw new Error(`AmoCRM API error: ${retryRes.status}`);
    return retryRes.json();
  }

  if (!res.ok) throw new Error(`AmoCRM API error: ${res.status}`);
  return res.json();
}

export async function findOrCreateContact(phone: string, name: string): Promise<number | null> {
  const config = await getConfig();
  if (!config) return null;

  try {
    const query = phone.replace(/\D/g, '');
    const searchResult = await apiRequest(config, 'GET', `/api/v4/contacts?query=${query}`) as { _embedded?: { contacts?: { id: number }[] } };

    if (searchResult?._embedded?.contacts?.length) {
      return searchResult._embedded.contacts[0].id;
    }

    const createResult = await apiRequest(config, 'POST', '/api/v4/contacts', [{
      name,
      custom_fields_values: phone ? [{
        field_code: 'PHONE',
        values: [{ value: phone, enum_code: 'WORK' }],
      }] : undefined,
    }]) as { _embedded?: { contacts?: { id: number }[] } };

    return createResult?._embedded?.contacts?.[0]?.id || null;
  } catch (e) {
    console.error('AmoCRM findOrCreateContact error:', e);
    return null;
  }
}

export async function createDeal(contactId: number, name: string, profileUrl: string): Promise<number | null> {
  const config = await getConfig();
  if (!config) return null;

  try {
    const result = await apiRequest(config, 'POST', '/api/v4/leads', [{
      name: `Заявка с МебПортал: ${name}`,
      pipeline_id: config.pipeline_id,
      status_id: config.status_id,
      _embedded: {
        contacts: [{ id: contactId }],
      },
      custom_fields_values: [{
        field_code: 'LINK',
        values: [{ value: profileUrl }],
      }],
    }]) as { _embedded?: { leads?: { id: number }[] } };

    return result?._embedded?.leads?.[0]?.id || null;
  } catch (e) {
    console.error('AmoCRM createDeal error:', e);
    return null;
  }
}

export async function addNoteToLead(leadId: number, message: string): Promise<void> {
  const config = await getConfig();
  if (!config) return;

  try {
    await apiRequest(config, 'POST', `/api/v4/leads/${leadId}/notes`, [{
      note_type: 'common',
      text: message,
    }]);
  } catch (e) {
    console.error('AmoCRM addNote error:', e);
  }
}

export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  const config = await getConfig();
  if (!config) return { success: false, error: 'Интеграция не настроена' };

  try {
    await apiRequest(config, 'GET', '/api/v4/account');
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
