'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  inn: string | null;
  avatar: string | null;
}

interface DownloadData {
  id: string;
  createdAt: string;
  image: { title: string; style: string | null; category: string | null; };
}

interface PostData {
  id: string;
  title: string;
  category: string | null;
  likes: number;
  createdAt: string;
  _count: { comments: number; };
}

interface StatsData {
  downloads: number;
  favoriteImages: number;
  posts: number;
  portfolio: number;
  followers: number;
  following: number;
  totalLikes: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [downloads, setDownloads] = useState<DownloadData[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [stats, setStats] = useState<StatsData>({ downloads: 0, favoriteImages: 0, posts: 0, portfolio: 0, followers: 0, following: 0, totalLikes: 0 });
  const [notifications, setNotifications] = useState<{ id: string; type: string; message: string; read: boolean; createdAt: string; fromUser: { name: string | null; avatar: string | null } | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      const hasCookie = document.cookie.includes('token=');
      if (!hasCookie) { window.location.href = '/login'; return; }
    }
    let authToken = token || '';
    if (!authToken) {
      const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
      if (match) authToken = decodeURIComponent(match[1]);
    }
    if (!authToken) { window.location.href = '/login'; return; }
    Promise.all([
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${authToken}` } }).then(r => r.json()),
      fetch('/api/downloads', { headers: { Authorization: `Bearer ${authToken}` } }).then(r => r.json()).catch(() => ({ downloads: [] })),
      fetch('/api/posts?limit=100', { headers: { Authorization: `Bearer ${authToken}` } }).then(r => r.json()).catch(() => ({ posts: [], pagination: { total: 0 } })),
      fetch('/api/portfolio?limit=1', { headers: { Authorization: `Bearer ${authToken}` } }).then(r => r.json()).catch(() => ({ pagination: { total: 0 } })),
      fetch('/api/notifications?limit=10', { headers: { Authorization: `Bearer ${authToken}` } }).then(r => r.json()).catch(() => ({ notifications: [] })),
    ])
      .then(async ([userData, downloadsData, postsData, portfolioData, notifData]) => {
        if (userData.user) {
          setUser(userData.user);
          const dlList = downloadsData.downloads || [];
          setDownloads(dlList);
          const allPosts = postsData.posts || [];
          const userPosts = allPosts.filter((p: { author?: { id?: string } }) => p.author?.id === userData.user.id);
          setPosts(userPosts);

          const totalLikes = userPosts.reduce((sum: number, p: { likes?: number }) => sum + (p.likes || 0), 0);

          let followersCount = 0;
          let followingCount = 0;
          try {
            const [followersRes, followingRes] = await Promise.all([
              fetch(`/api/users/${userData.user.id}/followers`),
              fetch(`/api/users/${userData.user.id}/following`),
            ]);
            const followersData = await followersRes.json();
            const followingData = await followingRes.json();
            followersCount = followersData.total || 0;
            followingCount = followingData.total || 0;
          } catch {}

          setStats({ downloads: dlList.length, favoriteImages: 0, posts: postsData.pagination?.total || 0, portfolio: portfolioData.pagination?.total || 0, followers: followersCount, following: followingCount, totalLikes });
          setNotifications(notifData.notifications || []);
        } else {
          localStorage.removeItem('token');
          document.cookie = 'token=; path=/; max-age=0';
          window.location.href = '/login';
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/; max-age=0';
        window.location.href = '/login';
      })
      .finally(() => setLoading(false));
  }, []);

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

  const roleLabels: Record<string, string> = {
    CLIENT: 'Клиент', USER: 'Специалист', SPECIALIST: 'Специалист', COMPANY: 'Компания / ИП',
    SUPPLIER: 'Поставщик', MANUFACTURER: 'Производство', ADMIN: 'Администратор',
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto">
        {/* Welcome */}
        <div className="relative overflow-hidden gradient-hero rounded-3xl p-8 md:p-10 text-white mb-8">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-400/10 rounded-full blur-3xl" />
          </div>
          <div className="relative flex items-center gap-5">
            {user?.avatar ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg flex-shrink-0">
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-bold border border-white/20 shadow-glass flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white drop-shadow-sm">Добро пожаловать, {user?.name || user?.email}!</h1>
              <div className="flex flex-wrap gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  {roleLabels[user?.role || 'USER']}
                </span>
                {user?.inn && <span>ИНН: {user.inn}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-8">
          {[
            { value: stats.downloads, label: 'Загрузок', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg> },
            { value: stats.posts, label: 'Постов', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg> },
            { value: stats.portfolio, label: 'Портфолио', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> },
            { value: stats.followers, label: 'Подписчиков', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
            { value: stats.following, label: 'Подписок', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> },
            { value: stats.favoriteImages, label: 'В избранном', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg> },
            { value: stats.totalLikes, label: 'Лайков', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> },
          ].map((stat, i) => (
            <div key={i} className="card-base p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">{stat.icon}</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</div>
              </div>
              <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
            </div>
          ))}
          <Link href="/gallery" className="card-base p-5 hover-lift group">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>
            <div className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">Каталог изображений</div>
          </Link>
          <Link href="/documents" className="card-base p-5 hover-lift group">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">Документы</div>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-8">
          {[
            { href: '/feed/new', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>, title: 'Новый пост', desc: 'Опубликовать в ленту' },
            { href: '/dashboard/portfolio', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>, title: 'Портфолио', desc: 'Мои работы и проекты' },
            { href: '/refs', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>, title: 'Справочники', desc: 'Размеры, нормы, паспорта' },
            { href: '/suppliers', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>, title: 'Поставщики', desc: 'Каталог поставщиков' },
            { href: '/specialists', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>, title: 'Специалисты', desc: 'Дизайнеры, технологи' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="card-base p-6 hover-lift group">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
              <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </Link>
          ))}
        </div>

        {/* Downloads */}
        <div className="card-base p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Последние загрузки</h2>
            {downloads.length > 0 && (
              <Link href="/gallery" className="text-brand-600 hover:text-brand-700 text-sm font-semibold flex items-center gap-1">
                Каталог
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
              </Link>
            )}
          </div>
          {downloads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              </div>
              <p className="text-gray-400 mb-2">Пока нет загрузок</p>
              <Link href="/gallery" className="text-brand-600 hover:text-brand-700 text-sm font-semibold">Перейти в каталог →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {downloads.slice(0, 10).map(dl => (
                <div key={dl.id} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-400 flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{dl.image.title}</p>
                      <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                        {dl.image.style && <span>{dl.image.style}</span>}
                        {dl.image.category && <span>· {dl.image.category}</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(dl.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="card-base p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Уведомления</h2>
              <span className="text-sm text-gray-400">{notifications.length} новых</span>
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 5).map(n => (
                <div key={n.id} className={`flex items-start gap-3 p-3.5 rounded-xl transition-colors ${n.read ? 'bg-white' : 'bg-brand-50/50'}`}>
                  {n.fromUser?.avatar ? (
                    <img src={n.fromUser.avatar} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {n.fromUser?.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-relaxed">{n.message}</p>
                    <span className="text-xs text-gray-400 mt-0.5 block">{new Date(n.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-2" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Posts */}
        <div className="card-base p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">Мои посты</h2>
            <div className="flex gap-3">
              <Link href="/feed/new" className="text-brand-600 hover:text-brand-700 text-sm font-semibold flex items-center gap-1">
                Новый пост
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              </Link>
              {stats.posts > 5 && (
                <Link href="/feed" className="text-gray-500 hover:text-gray-700 text-sm font-semibold flex items-center gap-1">
                  Все посты
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
                </Link>
              )}
            </div>
          </div>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
              </div>
              <p className="text-gray-400 mb-2">Пока нет постов</p>
              <Link href="/feed/new" className="text-brand-600 hover:text-brand-700 text-sm font-semibold">Опубликовать первый пост →</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {posts.map(post => (
                <Link key={post.id} href={`/feed/${post.id}`} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-400 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm group-hover:text-brand-600 transition-colors">{post.title}</p>
                      <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                        {post.category && <span>{post.category}</span>}
                        <span>{post.likes} лайков</span>
                        <span>{post._count.comments} комментариев</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
