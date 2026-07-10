'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface SubscriptionData {
  id: string;
  plan: string;
  period: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  pending: { text: 'Ожидает', color: 'bg-yellow-100 text-yellow-700' },
  active: { text: 'Активно', color: 'bg-green-100 text-green-700' },
  expired: { text: 'Истекло', color: 'bg-gray-100 text-gray-500' },
  cancelled: { text: 'Отменено', color: 'bg-red-100 text-red-600' },
};

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.user?.role !== 'ADMIN') router.push('/dashboard'); })
      .catch(() => router.push('/login'));
  }, [router]);

  const loadData = async (status = filter) => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }
    try {
      const params = status !== 'all' ? `?status=${status}` : '';
      const res = await fetch(`/api/admin/subscriptions${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch { setError('Ошибка загрузки данных'); setSubscriptions([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [filter]);

  const handleAction = async (id: string, action: 'active' | 'expired') => {
    if (!confirm(action === 'active' ? 'Активировать подписку?' : 'Деактивировать подписку?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setActing(id);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status: action }),
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error); return; }
      toast.success(action === 'active' ? 'Подписка активирована' : 'Подписка деактивирована');
      loadData();
    } catch { toast.error('Ошибка'); }
    finally { setActing(null); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  if (error) return (
    <div className="min-h-screen py-10">
      <div className="section-container max-w-5xl">
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => { setError(null); loadData(); }} className="text-brand-500 hover:underline">Попробовать снова</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Подписки</h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'all', label: 'Все' },
            { key: 'pending', label: 'Ожидает' },
            { key: 'active', label: 'Активно' },
            { key: 'expired', label: 'Истекло' },
          ].map(s => (
            <button key={s.key} onClick={() => { setFilter(s.key); setLoading(true); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === s.key ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Пользователь</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">План</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Период</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Статус</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Даты</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscriptions.map(s => {
                  const st = STATUS_LABELS[s.status] || STATUS_LABELS.pending;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{s.user.name || '—'}</div>
                        <div className="text-xs text-gray-500">{s.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${s.plan === 'premium' ? 'bg-amber-100 text-amber-700' : s.plan === 'pro' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-700'}`}>
                          {s.plan === 'premium' ? 'Premium' : s.plan === 'pro' ? 'Pro' : 'Lite'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.period === 'monthly' ? 'Месяц' : 'Год'}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${st.color}`}>{st.text}</span></td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {s.startDate && <div>С: {new Date(s.startDate).toLocaleDateString('ru-RU')}</div>}
                        {s.endDate && <div>До: {new Date(s.endDate).toLocaleDateString('ru-RU')}</div>}
                        {!s.startDate && <div>Создана: {new Date(s.createdAt).toLocaleDateString('ru-RU')}</div>}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {s.status === 'pending' && (
                          <button onClick={() => handleAction(s.id, 'active')} disabled={acting === s.id}
                            className="text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50">
                            Активировать
                          </button>
                        )}
                        {s.status === 'active' && (
                          <button onClick={() => handleAction(s.id, 'expired')} disabled={acting === s.id}
                            className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50">
                            Деактивировать
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {subscriptions.length === 0 && <p className="text-center py-8 text-gray-500">Нет подписок</p>}
        </div>
      </div>
    </div>
  );
}
