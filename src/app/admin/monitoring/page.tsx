'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageSEO from '@/components/PageSEO';

interface SystemData {
  db: { users: number; posts: number; images: number; products: number; feedback: number; activities: number };
  uptime: string;
  memory: { used: number; total: number };
  nodeVersion: string;
  platform: string;
  recentErrors: { action: string; details: string | null; createdAt: string }[];
}

export default function AdminMonitoringPage() {
  const router = useRouter();
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.user?.role !== 'ADMIN') { router.push('/dashboard'); return; }
        return fetch('/api/admin/monitoring', { headers: { Authorization: `Bearer ${token}` } });
      })
      .then(r => r?.json())
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen py-10">
      <PageSEO title="Админ: Мониторинг" description="Системный мониторинг портала" />
      <div className="section-container max-w-5xl">
        <Link href="/admin" className="text-sm text-gray-400 hover:text-brand-500 transition-colors mb-4 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Мониторинг системы</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {data?.db && Object.entries(data.db).map(([key, val]) => {
            const labels: Record<string, string> = { users: 'Пользователи', posts: 'Посты', images: 'Изображения', products: 'Товары', feedback: 'Обратная связь', activities: 'Логи' };
            const colors: Record<string, string> = { users: 'bg-blue-50 text-blue-600', posts: 'bg-amber-50 text-amber-600', images: 'bg-purple-50 text-purple-600', products: 'bg-emerald-50 text-emerald-600', feedback: 'bg-red-50 text-red-600', activities: 'bg-gray-50 text-gray-600' };
            return (
              <div key={key} className="card-base p-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colors[key] || 'bg-gray-100'}`}>
                  <span className="text-lg font-bold">{val}</span>
                </div>
                <p className="text-sm text-gray-600">{labels[key] || key}</p>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card-base p-5">
            <h2 className="font-bold text-gray-900 mb-3">Система</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Аптайм</span><span className="font-medium">{data?.uptime || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Node.js</span><span className="font-medium">{data?.nodeVersion || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Платформа</span><span className="font-medium">{data?.platform || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Память</span><span className="font-medium">{data?.memory ? `${data.memory.used} MB / ${data.memory.total} MB` : '—'}</span></div>
            </div>
          </div>

          <div className="card-base p-5">
            <h2 className="font-bold text-gray-900 mb-3">Последние ошибки</h2>
            {data?.recentErrors && data.recentErrors.length > 0 ? (
              <div className="space-y-2">
                {data.recentErrors.map((err, i) => (
                  <div key={i} className="bg-red-50 rounded-lg p-3 text-xs">
                    <span className="font-medium text-red-700">{err.action}</span>
                    <p className="text-red-600 mt-1">{err.details || '—'}</p>
                    <span className="text-red-400">{new Date(err.createdAt).toLocaleString('ru-RU')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Ошибок не обнаружено</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
