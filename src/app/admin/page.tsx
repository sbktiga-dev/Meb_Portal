'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface StatsData {
  users: number;
  images: number;
  documents: number;
  suppliers: number;
  companies: number;
  specialists: number;
  manufacturers: number;
  downloads: number;
  posts: number;
  products: number;
  groups: number;
  events: number;
  notifications: number;
  newUsers7d: number;
  newUsers30d: number;
  newPosts7d: number;
  newPosts30d: number;
  unreadNotifications: number;
}

interface RecentUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  avatar: string | null;
}

interface PopularPost {
  id: string;
  title: string;
  views: number;
  likes: number;
  createdAt: string;
  author: { name: string | null };
}

interface PopularImage {
  id: string;
  title: string;
  downloads: number;
  createdAt: string;
}

interface RegistrationsByDay {
  date: string;
  count: number;
}

export default function AdminPage() {
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([]);
  const [popularImages, setPopularImages] = useState<PopularImage[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationsByDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.user?.role !== 'ADMIN') { window.location.href = '/dashboard'; return; }
        setUser(data.user);
        return fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
      })
      .then(res => res?.json())
      .then(data => {
        if (data?.stats) {
          setStats(data.stats);
          setRecentUsers(data.recentUsers || []);
          setPopularPosts(data.popularPosts || []);
          setPopularImages(data.popularImages || []);
          setRegistrations(data.registrationsByDay || []);
        }
      })
      .catch(() => window.location.href = '/login')
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  const maxRegCount = Math.max(...registrations.map(r => Number(r.count)), 1);

  const statCards = [
    { value: stats?.users, label: 'Пользователей', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>, color: 'bg-blue-50 text-blue-500', change: `+${stats?.newUsers7d || 0} за неделю` },
    { value: stats?.posts, label: 'Постов', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>, color: 'bg-amber-50 text-amber-500', change: `+${stats?.newPosts7d || 0} за неделю` },
    { value: stats?.images, label: 'Изображений', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>, color: 'bg-brand-50 text-brand-500' },
    { value: stats?.downloads, label: 'Загрузок', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>, color: 'bg-purple-50 text-purple-500' },
    { value: stats?.products, label: 'Товаров', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>, color: 'bg-emerald-50 text-emerald-500' },
  ];

  const sections = [
    { href: '/admin/users', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>, label: 'Пользователи', count: stats?.users },
    { href: '/admin/posts', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>, label: 'Посты', count: stats?.posts },
    { href: '/admin/images', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>, label: 'Изображения', count: stats?.images },
    { href: '/admin/documents', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>, label: 'Документы', count: stats?.documents },
    { href: '/admin/companies', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/></svg>, label: 'Компании', count: (stats?.companies || 0) + (stats?.suppliers || 0) + (stats?.manufacturers || 0) },
  ];

  return (
    <div className="min-h-screen py-10">
      <div className="section-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Админ-панель</h1>
            <p className="text-gray-500 mt-1">Обзор платформы</p>
          </div>
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {statCards.map((stat, i) => (
                <div key={i} className="card-base p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value || 0}</div>
                  </div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                  {stat.change && <div className="text-xs text-emerald-600 font-medium mt-1">{stat.change}</div>}
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 card-base p-5">
                <h2 className="font-bold text-gray-900 mb-4">Регистрации (30 дней)</h2>
                <div className="flex items-end gap-1 h-32">
                  {registrations.length === 0 ? (
                    <div className="text-sm text-gray-400 w-full text-center py-8">Нет данных</div>
                  ) : (
                    registrations.map((r, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-brand-400 rounded-t transition-all duration-300 min-h-[2px]"
                          style={{ height: `${(Number(r.count) / maxRegCount) * 100}%` }}
                          title={`${r.date}: ${r.count}`}
                        />
                      </div>
                    ))
                  )}
                </div>
                {registrations.length > 0 && (
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>{registrations[0]?.date}</span>
                    <span>{registrations[registrations.length - 1]?.date}</span>
                  </div>
                )}
              </div>

              <div className="card-base p-5">
                <h2 className="font-bold text-gray-900 mb-4">Сводка</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">За 7 дней</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{stats.newUsers7d} пользователей</span>
                      <span className="text-gray-400 mx-2">·</span>
                      <span className="font-semibold text-gray-900">{stats.newPosts7d} постов</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">За 30 дней</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{stats.newUsers30d} пользователей</span>
                      <span className="text-gray-400 mx-2">·</span>
                      <span className="font-semibold text-gray-900">{stats.newPosts30d} постов</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Уведомлений</span>
                    <span className="font-semibold text-gray-900">{stats.notifications} <span className="text-xs text-gray-400">({stats.unreadNotifications} непрочитанных)</span></span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Групп</span>
                    <span className="font-semibold text-gray-900">{stats.groups}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Событий</span>
                    <span className="font-semibold text-gray-900">{stats.events}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div className="card-base p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Последние регистрации</h2>
                  <Link href="/admin/users" className="text-sm text-brand-500 hover:text-brand-600">Все →</Link>
                </div>
                <div className="space-y-3">
                  {recentUsers.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Нет пользователей</p>
                  ) : (
                    recentUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-3 py-2">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {(u.name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{u.name || 'Пользователь'}</p>
                          <p className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString('ru-RU')}</p>
                        </div>
                        {u.role === 'ADMIN' && <span className="badge-brand text-[10px]">Admin</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="card-base p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Популярные посты</h2>
                  <Link href="/admin/posts" className="text-sm text-brand-500 hover:text-brand-600">Все →</Link>
                </div>
                <div className="space-y-3">
                  {popularPosts.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">Нет постов</p>
                  ) : (
                    popularPosts.map(p => (
                      <div key={p.id} className="flex items-center gap-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                          <p className="text-xs text-gray-400">{p.author.name || 'Аноним'}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            {p.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                            {p.likes}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {sections.map(section => (
            <Link key={section.href} href={section.href} className="card-base p-5 hover-lift group">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center mb-3 group-hover:bg-brand-100 transition-colors">
                {section.icon}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-brand-600 transition-colors">{section.label}</h3>
              {section.count !== undefined && (
                <span className="text-xs text-gray-400 mt-1 block">{section.count} записей</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}