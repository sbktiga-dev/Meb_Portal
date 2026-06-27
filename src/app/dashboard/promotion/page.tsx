'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

export default function PromotionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    setLoading(false);
  }, [router]);

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Продвижение</h1>
          <p className="text-gray-500 mb-8">Продвижение вашего профиля и контента</p>

          <div className="card-base p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-brand-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path d="M11 5.882V19.24a1.75 1.75 0 01-3.5.243M14 5.882V19.24a1.75 1.75 0 003.5.243M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Скоро будет доступно</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Раздел продвижения находится в разработке. Здесь вы сможете продвигать свой профиль,
              товары и услуги среди пользователей портала.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: '📊', title: 'Аналитика', desc: 'Статистика просмотров и переходов' },
                { icon: '🎯', title: 'Таргетинг', desc: 'Показ вашим целевым аудиториям' },
                { icon: '💎', title: 'Топ-позиции', desc: 'Выделение в каталоге и поиске' },
              ].map(item => (
                <div key={item.title} className="p-4 rounded-xl bg-gray-50 text-center">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-semibold text-sm text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                </div>
              ))}
            </div>

            <Link href="/dashboard" className="btn-primary">
              Вернуться в кабинет
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
