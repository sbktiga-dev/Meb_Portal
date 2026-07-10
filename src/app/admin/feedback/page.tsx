'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageSEO from '@/components/PageSEO';

interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  ip: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; avatar: string | null } | null;
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(r => r.json())
      .then(d => { if (d.user?.role !== 'ADMIN') router.push('/dashboard'); })
      .catch(() => router.push('/login'));
    return () => controller.abort();
  }, [router]);

  const fetchFeedbacks = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await fetch(`/api/admin/feedback?${params}`, { headers: { Authorization: `Bearer ${token}` }, signal });
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
      setTotal(data.total || 0);
    } catch { setError('Ошибка загрузки данных'); }
    setLoading(false);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchFeedbacks(controller.signal);
    return () => controller.abort();
  }, [page, typeFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить отзыв?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      alert('Ошибка удаления');
      return;
    }
    setFeedbacks(prev => prev.filter(f => f.id !== id));
    setTotal(prev => prev - 1);
  };

  return (
    <div className="min-h-screen py-10">
      <PageSEO title="Админ: Обратная связь" description="Управление обратной связью пользователей" />
      <div className="section-container max-w-5xl">
        <Link href="/admin" className="text-sm text-gray-400 dark:text-gray-500 hover:text-brand-500 transition-colors mb-4 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Обратная связь</h1>

        <div className="flex gap-2 mb-6">
          {[{ v: 'all', l: 'Все' }, { v: 'bug', l: 'Ошибки' }, { v: 'feature', l: 'Фичи' }].map(t => (
            <button key={t.v} onClick={() => { setTypeFilter(t.v); setPage(1); }} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${typeFilter === t.v ? 'bg-brand-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
              {t.l}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-400 dark:text-gray-500 self-center">{total} всего</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">Загрузка...</div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={() => { setError(null); fetchFeedbacks(); }} className="text-brand-500 hover:underline">Попробовать снова</button>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">Нет отзывов</div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map(f => (
              <div key={f.id} className="card-base p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge ${f.type === 'bug' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'}`}>
                        {f.type === 'bug' ? 'Ошибка' : 'Фича'}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(f.createdAt).toLocaleString('ru-RU')}</span>
                      {f.user && <span className="text-xs text-gray-500 dark:text-gray-400">{f.user.name || f.user.email}</span>}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{f.message}</p>
                  </div>
                  <button onClick={() => handleDelete(f.id)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > limit && (
          <div className="flex justify-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost disabled:opacity-40">Назад</button>
            <span className="text-sm text-gray-500 dark:text-gray-400 self-center">Стр. {page} из {Math.ceil(total / limit)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)} className="btn-ghost disabled:opacity-40">Далее</button>
          </div>
        )}
      </div>
    </div>
  );
}
