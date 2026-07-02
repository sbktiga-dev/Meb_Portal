'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PromotionData {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  post: { id: string; title: string; category: string };
  user: { id: string; name: string | null; email: string };
}

interface BannerData {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  pending: { text: 'Ожидает', color: 'bg-yellow-100 text-yellow-700' },
  active: { text: 'Активно', color: 'bg-green-100 text-green-700' },
  expired: { text: 'Истекло', color: 'bg-gray-100 text-gray-500' },
};

const POSITION_LABELS: Record<string, string> = {
  feed: 'Лента',
  gallery: 'Каталог',
  both: 'Лента + Каталог',
};

export default function AdminPromotionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<PromotionData[]>([]);
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [filter, setFilter] = useState('pending');
  const [updating, setUpdating] = useState<string | null>(null);

  const loadData = async (status?: string, signal?: AbortSignal) => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    try {
      const params = status ? `?status=${status}` : '';
      const res = await fetch(`/api/admin/promotion${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      if (!res.ok) { router.push('/dashboard'); return; }
      const data = await res.json();
      setPromotions(data.promotions || []);
      setBanners(data.banners || []);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadData(filter, controller.signal);
    return () => controller.abort();
  }, [filter]);

  const handleStatusChange = async (type: 'promotion' | 'banner', id: string, newStatus: string) => {
    setUpdating(id);
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch('/api/admin/promotion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, type, status: newStatus }),
      });
      loadData(filter);
    } catch {
      // Error handled silently
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Управление продвижением</h1>

        {/* Фильтры */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'pending', label: 'Ожидает' },
            { key: 'active', label: 'Активно' },
            { key: 'expired', label: 'Истекло' },
            { key: '', label: 'Все' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f.key
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Продвижение постов */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Продвижение постов</h2>
          </div>
          {promotions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Нет заявок</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Пользователь</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Пост</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Срок</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Статус</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {promotions.map(p => {
                  const st = STATUS_LABELS[p.status] || STATUS_LABELS.pending;
                  const days = Math.ceil((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / 86400000);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{p.user.name || 'Без имени'}</div>
                        <div className="text-gray-500 text-xs">{p.user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{p.post.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{days} дн.</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${st.color}`}>{st.text}</span></td>
                      <td className="px-6 py-4 text-right">
                        {p.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange('promotion', p.id, 'active')}
                            disabled={updating === p.id}
                            className="text-green-600 hover:text-green-700 text-sm font-medium mr-3 disabled:opacity-50"
                          >
                            Активировать
                          </button>
                        )}
                        {p.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange('promotion', p.id, 'expired')}
                            disabled={updating === p.id}
                            className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                          >
                            Деактивировать
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Баннеры */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Баннеры</h2>
          </div>
          {banners.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Нет баннеров</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Пользователь</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Название</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Позиция</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Срок</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Статус</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {banners.map(b => {
                  const st = STATUS_LABELS[b.status] || STATUS_LABELS.pending;
                  const days = Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / 86400000);
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900">{b.user.name || 'Без имени'}</div>
                        <div className="text-gray-500 text-xs">{b.user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{b.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{POSITION_LABELS[b.position] || b.position}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{days} дн.</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${st.color}`}>{st.text}</span></td>
                      <td className="px-6 py-4 text-right">
                        {b.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange('banner', b.id, 'active')}
                            disabled={updating === b.id}
                            className="text-green-600 hover:text-green-700 text-sm font-medium mr-3 disabled:opacity-50"
                          >
                            Активировать
                          </button>
                        )}
                        {b.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange('banner', b.id, 'expired')}
                            disabled={updating === b.id}
                            className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                          >
                            Деактивировать
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
