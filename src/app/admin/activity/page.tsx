'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageSEO from '@/components/PageSEO';

interface ActivityItem {
  id: string;
  action: string;
  details: string | null;
  ip: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string } | null;
}

const actionLabels: Record<string, string> = {
  login: 'Вход', register: 'Регистрация', post_create: 'Создание поста', comment: 'Комментарий',
  follow: 'Подписка', ban: 'Бан', role_change: 'Смена роли', feedback: 'Обратная связь',
  post_delete: 'Удаление поста', user_delete: 'Удаление пользователя',
};

export default function AdminActivityPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const limit = 30;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.user?.role !== 'ADMIN') router.push('/dashboard'); })
      .catch(() => router.push('/login'));
  }, [router]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (actionFilter) params.set('action', actionFilter);
      const res = await fetch(`/api/admin/activity?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch { setError('Ошибка загрузки данных'); }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter]);

  return (
    <div className="min-h-screen py-10 bg-white dark:bg-gray-900">
      <PageSEO title="Админ: Журнал действий" description="Лог действий пользователей" />
      <div className="section-container max-w-5xl">
        <Link href="/admin" className="text-sm text-gray-400 dark:text-gray-500 hover:text-brand-500 transition-colors mb-4 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Журнал действий</h1>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => { setActionFilter(''); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!actionFilter ? 'bg-brand-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>Все</button>
          {Object.entries(actionLabels).map(([key, label]) => (
            <button key={key} onClick={() => { setActionFilter(key); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${actionFilter === key ? 'bg-brand-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">Загрузка...</div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
            <button onClick={() => { setError(null); fetchLogs(); }} className="text-brand-500 hover:underline">Попробовать снова</button>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">Нет записей</div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Время</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Пользователь</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действие</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Детали</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">{new Date(log.createdAt).toLocaleString('ru-RU')}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{log.user?.name || log.user?.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{actionLabels[log.action] || log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
