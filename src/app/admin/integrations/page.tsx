'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

interface IntegrationData {
  id: string;
  type: string;
  enabled: boolean;
  domain: string;
  client_id: string;
  pipeline_id: number;
  status_id: number;
  hasTokens: boolean;
}

export default function AdminIntegrationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [integration, setIntegration] = useState<IntegrationData | null>(null);
  const [form, setForm] = useState({
    domain: '',
    client_id: '',
    client_secret: '',
    access_token: '',
    refresh_token: '',
    pipeline_id: '',
    status_id: '',
  });

  const loadData = useCallback(async (signal?: AbortSignal) => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const res = await fetch('/api/admin/integrations', { headers: { Authorization: `Bearer ${token}` }, signal });
      const data = await res.json();
      if (data.integration) {
        setIntegration(data.integration);
        setForm({
          domain: data.integration.domain || '',
          client_id: data.integration.client_id || '',
          client_secret: '',
          access_token: '',
          refresh_token: '',
          pipeline_id: String(data.integration.pipeline_id || ''),
          status_id: String(data.integration.status_id || ''),
        });
      }
    } catch { toast.error('Ошибка загрузки'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          pipeline_id: form.pipeline_id ? parseInt(form.pipeline_id) : undefined,
          status_id: form.status_id ? parseInt(form.status_id) : undefined,
        }),
      });
      if (res.ok) {
        toast.success('Настройки сохранены');
        loadData();
      } else {
        toast.error('Ошибка сохранения');
      }
    } catch { toast.error('Ошибка сети'); }
    finally { setSaving(false); }
  };

  const handleToggle = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: !integration?.enabled }),
      });
      toast.success(integration?.enabled ? 'Интеграция отключена' : 'Интеграция включена');
      loadData();
    } catch { toast.error('Ошибка'); }
  };

  const handleTest = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setTesting(true);
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Подключение успешно!');
      } else {
        toast.error(data.error || 'Ошибка подключения');
      }
    } catch { toast.error('Ошибка сети'); }
    finally { setTesting(false); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Интеграции</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Настройка внешних сервисов</p>

          {/* AmoCRM */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">AmoCRM</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Автоматическое создание сделок при первом сообщении от клиента</p>
              </div>
              <button
                onClick={handleToggle}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  integration?.enabled
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {integration?.enabled ? 'Включено' : 'Отключено'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Домен</label>
                <input
                  type="text"
                  value={form.domain}
                  onChange={e => setForm({ ...form, domain: e.target.value })}
                  className="input-premium"
                  placeholder="example.amocrm.ru"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Client ID</label>
                  <input
                    type="text"
                    value={form.client_id}
                    onChange={e => setForm({ ...form, client_id: e.target.value })}
                    className="input-premium"
                    placeholder="Client ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Client Secret</label>
                  <input
                    type="password"
                    value={form.client_secret}
                    onChange={e => setForm({ ...form, client_secret: e.target.value })}
                    className="input-premium"
                    placeholder="Client Secret"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Access Token</label>
                  <input
                    type="password"
                    value={form.access_token}
                    onChange={e => setForm({ ...form, access_token: e.target.value })}
                    className="input-premium"
                    placeholder="Access Token"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Refresh Token</label>
                  <input
                    type="password"
                    value={form.refresh_token}
                    onChange={e => setForm({ ...form, refresh_token: e.target.value })}
                    className="input-premium"
                    placeholder="Refresh Token"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">ID воронки</label>
                  <input
                    type="number"
                    value={form.pipeline_id}
                    onChange={e => setForm({ ...form, pipeline_id: e.target.value })}
                    className="input-premium"
                    placeholder="Pipeline ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">ID статуса</label>
                  <input
                    type="number"
                    value={form.status_id}
                    onChange={e => setForm({ ...form, status_id: e.target.value })}
                    className="input-premium"
                    placeholder="Status ID"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button onClick={handleTest} disabled={testing} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  {testing ? 'Проверка...' : 'Проверить подключение'}
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Как работает:</strong> При первом сообщении от клиента (роль CLIENT) автоматически создаётся контакт и сделка в AmoCRM. Все последующие сообщения добавляются как примечания к сделке.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
