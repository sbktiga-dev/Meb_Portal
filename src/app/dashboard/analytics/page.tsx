'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AnalyticsData {
  user: { id: string; name: string | null; role: string };
  posts: { total: number; thisWeek: number; totalViews: number; totalLikes: number };
  portfolio: { total: number; thisWeek: number };
  downloads: { total: number; thisWeek: number };
  followers: number;
  following: number;
  recentPosts: { id: string; title: string; views: number; likes: number; createdAt: string }[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(async (me) => {
        if (!me.user) { router.push('/login'); return; }

        const [postsRes, portfolioRes, downloadsRes, followersRes, followingRes] = await Promise.all([
          fetch(`/api/posts?authorId=${me.user.id}&limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/portfolio', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/downloads', { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/users/${me.user.id}/followers`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/users/${me.user.id}/following`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const [postsData, portfolioData, downloadsData, followersData, followingData] = await Promise.all([
          postsRes.json(),
          portfolioRes.json(),
          downloadsRes.json(),
          followersRes.json(),
          followingRes.json(),
        ]);

        const posts = postsData.posts || [];
        const portfolio = portfolioData.portfolio || [];
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        setData({
          user: me.user,
          posts: {
            total: posts.length,
            thisWeek: posts.filter((p: { createdAt: string }) => new Date(p.createdAt) > weekAgo).length,
            totalViews: posts.reduce((sum: number, p: { views: number }) => sum + (p.views || 0), 0),
            totalLikes: posts.reduce((sum: number, p: { likes: number }) => sum + (p.likes || 0), 0),
          },
          portfolio: {
            total: portfolio.length,
            thisWeek: portfolio.filter((p: { createdAt: string }) => new Date(p.createdAt) > weekAgo).length,
          },
          downloads: {
            total: downloadsData.downloads?.length || 0,
            thisWeek: (downloadsData.downloads || []).filter((d: { createdAt: string }) => new Date(d.createdAt) > weekAgo).length,
          },
          followers: followersData.followers?.length || 0,
          following: followingData.following?.length || 0,
          recentPosts: posts.slice(0, 5).map((p: { id: string; title: string; views: number; likes: number; createdAt: string }) => ({
            id: p.id, title: p.title, views: p.views || 0, likes: p.likes || 0, createdAt: p.createdAt,
          })),
        });
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const statCards = [
    { label: 'Постов', value: data.posts.total, sub: `+${data.posts.thisWeek} за неделю`, icon: '📝', color: 'bg-blue-50 text-blue-600' },
    { label: 'Просмотров', value: data.posts.totalViews, sub: 'всего постов', icon: '👁', color: 'bg-purple-50 text-purple-600' },
    { label: 'Лайков', value: data.posts.totalLikes, sub: 'к постам', icon: '❤️', color: 'bg-red-50 text-red-600' },
    { label: 'Портфолио', value: data.portfolio.total, sub: `+${data.portfolio.thisWeek} за неделю`, icon: '🎨', color: 'bg-amber-50 text-amber-600' },
    { label: 'Скачиваний', value: data.downloads.total, sub: `+${data.downloads.thisWeek} за неделю`, icon: '⬇️', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Подписчиков', value: data.followers, sub: `Подписок: ${data.following}`, icon: '👥', color: 'bg-brand-50 text-brand-600' },
  ];

  return (
    <div className="min-h-screen py-10">
      <div className="section-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Аналитика</h1>
            <p className="text-gray-500 mt-1">Статистика вашей активности</p>
          </div>
          <div className="flex gap-2">
            {[
              { key: 'week', label: 'Неделя' },
              { key: 'month', label: 'Месяц' },
              { key: 'all', label: 'Всё время' },
            ].map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p.key ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <div key={i} className="card-base p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s` }}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color} text-lg mb-2`}>{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Мои посты</h2>
              <Link href="/feed?authorId=me" className="text-sm text-brand-500 hover:text-brand-600">Все →</Link>
            </div>
            {data.recentPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-3">У вас пока нет постов</p>
                <Link href="/feed/new" className="btn-primary text-sm">Создать пост</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentPosts.map(post => (
                  <Link key={post.id} href={`/feed/${post.id}`} className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                      <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString('ru-RU')}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        {post.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                        {post.likes}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card-base p-5">
            <h2 className="font-bold text-gray-900 mb-4">Быстрые действия</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/feed/new" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Новый пост</p>
                  <p className="text-xs text-gray-400">Опубликовать</p>
                </div>
              </Link>
              <Link href="/dashboard/portfolio/new" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Портфолио</p>
                  <p className="text-xs text-gray-400">Добавить работу</p>
                </div>
              </Link>
              <Link href="/groups" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Группы</p>
                  <p className="text-xs text-gray-400">Найти сообщество</p>
                </div>
              </Link>
              <Link href="/events" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">События</p>
                  <p className="text-xs text-gray-400">Мероприятия</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
