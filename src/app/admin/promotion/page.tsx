'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface PromotionData {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  post: { id: string; title: string; category: string; content: string; images: string; tags: string; author: { name: string | null; avatar: string | null } };
  user: { id: string; name: string | null; email: string };
}

interface BannerData {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  targetCategory: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  pending: { text: 'Ожидает', color: 'bg-yellow-100 text-yellow-700' },
  active: { text: 'Активно', color: 'bg-green-100 text-green-700' },
  expired: { text: 'Истекло', color: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' },
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
  const [previewPromo, setPreviewPromo] = useState<PromotionData | null>(null);
  const [previewBanner, setPreviewBanner] = useState<BannerData | null>(null);

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

  const parseImages = (imagesStr: string): string[] => {
    try { return JSON.parse(imagesStr); } catch { return []; }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Управление продвижением</h1>

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
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Продвижение постов */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Продвижение постов</h2>
          </div>
          {promotions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Нет заявок</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Пользователь</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Пост</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Срок</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Статус</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {promotions.map(p => {
                  const st = STATUS_LABELS[p.status] || STATUS_LABELS.pending;
                  const days = Math.ceil((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / 86400000);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setPreviewPromo(p)}>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{p.user.name || 'Без имени'}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{p.user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{p.post.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{days} дн.</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${st.color}`}>{st.text}</span></td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Баннеры</h2>
          </div>
          {banners.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Нет баннеров</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Пользователь</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Название</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Позиция</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Срок</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Статус</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {banners.map(b => {
                  const st = STATUS_LABELS[b.status] || STATUS_LABELS.pending;
                  const days = Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / 86400000);
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setPreviewBanner(b)}>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{b.user.name || 'Без имени'}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{b.user.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{b.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{POSITION_LABELS[b.position] || b.position}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{days} дн.</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${st.color}`}>{st.text}</span></td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
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

      {/* Модал предпросмотра поста */}
      {previewPromo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewPromo(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Пост: {previewPromo.post.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Автор: {previewPromo.user.name || previewPromo.user.email}</p>
              </div>
              <button onClick={() => setPreviewPromo(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {previewPromo.post.images && parseImages(previewPromo.post.images).length > 0 && (
                <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                  {parseImages(previewPromo.post.images).slice(0, 4).map((url, i) => (
                    <div key={i} className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                      <Image src={url} alt="" fill className="object-cover" sizes="300px" unoptimized />
                    </div>
                  ))}
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{previewPromo.post.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{previewPromo.post.content}</p>
              </div>
              {previewPromo.post.tags && (
                <div className="flex flex-wrap gap-1.5">
                  {(() => { try { return JSON.parse(previewPromo.post.tags); } catch { return []; } })().map((tag: string) => (
                    <span key={tag} className="text-xs bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t dark:border-gray-700">
                <span>Категория: {previewPromo.post.category}</span>
                <span>Создан: {new Date(previewPromo.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модал предпросмотра баннера */}
      {previewBanner && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewBanner(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Баннер: {previewBanner.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Автор: {previewBanner.user.name || previewBanner.user.email}</p>
              </div>
              <button onClick={() => setPreviewBanner(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {previewBanner.imageUrl && (
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <Image src={previewBanner.imageUrl} alt={previewBanner.title} fill className="object-cover" sizes="(max-width: 600px) 100vw, 600px" unoptimized />
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Название:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{previewBanner.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Позиция:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{POSITION_LABELS[previewBanner.position] || previewBanner.position}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Аудитория:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{previewBanner.targetCategory === 'all' ? 'Все категории' : previewBanner.targetCategory}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Ссылка:</span>
                  <a href={previewBanner.linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:text-brand-700 truncate max-w-[250px]">{previewBanner.linkUrl}</a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Создан:</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">{new Date(previewBanner.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
