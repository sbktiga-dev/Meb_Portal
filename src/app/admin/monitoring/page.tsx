'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageSEO from '@/components/PageSEO';

interface SystemData {
  db: { users: number; posts: number; images: number; products: number; feedback: number; activities: number; documents: number; refs: number; groups: number; events: number; suppliers: number; manufacturers: number; companies: number };
  uptime: string;
  memory: { used: number; total: number };
  disk: { total: number; used: number; percent: number };
  dbSize: number;
  nodeVersion: string;
  platform: string;
  recentErrors: { action: string; details: string | null; createdAt: string }[];
}

const dbLabels: Record<string, string> = { users: 'Пользователи', posts: 'Посты', images: 'Изображения', products: 'Товары', feedback: 'Обратная связь', activities: 'Логи', documents: 'Документы', refs: 'Справочники', groups: 'Группы', events: 'События', suppliers: 'Поставщики', manufacturers: 'Производства', companies: 'Компании' };
const dbColors: Record<string, string> = {
  users: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  posts: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  images: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  products: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  feedback: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  activities: 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  documents: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
  refs: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  groups: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
  events: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  suppliers: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
  manufacturers: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
  companies: 'bg-lime-50 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400',
};

export default function AdminMonitoringPage() {
  const router = useRouter();
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        if (d.user?.role !== 'ADMIN') { router.push('/dashboard'); return; }
        return fetch('/api/admin/monitoring', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
      })
      .then(r => r?.json())
      .then(d => { if (d) setData(d); })
      .catch(() => { setError('Ошибка загрузки данных'); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [router]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>;

  if (error) return (
    <div className="min-h-screen py-10 bg-white dark:bg-gray-900">
      <div className="section-container max-w-5xl">
        <div className="text-center py-20">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button onClick={() => { setError(null); window.location.reload(); }} className="text-brand-500 hover:underline">Попробовать снова</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-10 bg-white dark:bg-gray-900">
      <PageSEO title="Админ: Мониторинг" description="Системный мониторинг портала" />
      <div className="section-container max-w-5xl">
        <Link href="/admin" className="text-sm text-gray-400 dark:text-gray-500 hover:text-brand-500 transition-colors mb-4 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Мониторинг системы</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {data?.db && Object.entries(data.db).map(([key, val]) => (
              <div key={key} className="card-base p-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${dbColors[key] || 'bg-gray-100 dark:bg-gray-700'}`}>
                  <span className="text-lg font-bold">{String(val)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{dbLabels[key] || key}</p>
              </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card-base p-5">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Система</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Аптайм</span><span className="font-medium dark:text-gray-200">{data?.uptime || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Node.js</span><span className="font-medium dark:text-gray-200">{data?.nodeVersion || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Платформа</span><span className="font-medium dark:text-gray-200">{data?.platform || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Память (Heap)</span><span className="font-medium dark:text-gray-200">{data?.memory ? `${data.memory.used} MB / ${data.memory.total} MB` : '—'}</span></div>
            </div>
          </div>

          <div className="card-base p-5">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Хранилище и память</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Диск</span>
                  <span className="font-medium dark:text-gray-200">{data?.disk ? `${data.disk.used} MB / ${data.disk.total} MB` : '—'}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${data?.disk && data.disk.percent > 80 ? 'bg-red-500' : data?.disk && data.disk.percent > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${data?.disk?.percent || 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{data?.disk?.percent || 0}% занято</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Размер БД</span>
                <span className="font-medium dark:text-gray-200">{data?.dbSize ? `${data.dbSize} MB` : '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Всего объектов</span>
                <span className="font-medium dark:text-gray-200">{data?.db ? Object.values(data.db).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-base p-5 mb-8">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Последние ошибки</h2>
          {data?.recentErrors && data.recentErrors.length > 0 ? (
            <div className="space-y-2">
              {data.recentErrors.map((err, i) => (
                <div key={i} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-xs">
                  <span className="font-medium text-red-700 dark:text-red-400">{err.action}</span>
                  <p className="text-red-600 dark:text-red-400 mt-1">{err.details || '—'}</p>
                  <span className="text-red-400 dark:text-red-500">{new Date(err.createdAt).toLocaleString('ru-RU')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">Ошибок не обнаружено</p>
          )}
        </div>
      </div>
    </div>
  );
}
