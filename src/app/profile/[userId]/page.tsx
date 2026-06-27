'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/components/Loading';
import FollowButton from '@/components/FollowButton';

interface ProfileData {
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    cover: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    role: string;
    inn: string | null;
    socialLinks: string;
    createdAt: string;
    _count: { posts: number; followers: number; following: number; portfolio: number };
  };
  specialist: { type: string; description: string | null; experience: number | null; rating: number } | null;
  company: { id: string; name: string; description: string | null; logo: string | null; website: string | null; isVerified: boolean } | null;
  supplier: { id: string; companyName: string; description: string | null; logo: string | null; website: string | null; categories: string; isVerified: boolean } | null;
  manufacturer: { id: string; name: string; description: string | null; logo: string | null; website: string | null; isVerified: boolean } | null;
  recentPosts: { id: string; title: string; category: string; likes: number; views: number; createdAt: string; _count: { comments: number } }[];
  recentPortfolio: { id: string; title: string; images: string; category: string | null; createdAt: string }[];
}

const roleLabels: Record<string, { label: string; color: string; icon: string }> = {
  USER: { label: 'Специалист', color: 'bg-purple-100 text-purple-700', icon: '✦' },
  COMPANY: { label: 'Компания', color: 'bg-blue-100 text-blue-700', icon: '◆' },
  SUPPLIER: { label: 'Поставщик', color: 'bg-emerald-100 text-emerald-700', icon: '●' },
  MANUFACTURER: { label: 'Производство', color: 'bg-amber-100 text-amber-700', icon: '■' },
  CLIENT: { label: 'Клиент', color: 'bg-gray-100 text-gray-700', icon: '○' },
};

const specialistTypes: Record<string, string> = {
  DESIGNER: 'Дизайнер',
  TECHNOLOGIST: 'Технолог',
  INSTALLER: 'Установщик',
  MANAGER: 'Менеджер',
};

const socialIcons: Record<string, string> = {
  telegram: '✈',
  whatsapp: '💬',
  vk: 'V',
  youtube: '▶',
  instagram: '📷',
  website: '🌐',
};

const avatarGradients = [
  'from-brand-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-purple-400 to-pink-500',
  'from-blue-400 to-indigo-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-500',
];

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.user) setCurrentUserId(d.user.id); })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${params.userId}/profile`);
        if (!res.ok) { setProfile(null); return; }
        const data = await res.json();
        setProfile(data);
      } catch { setProfile(null); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [params.userId]);

  if (loading) return <Loading text="Загрузка профиля..." />;
  if (!profile) return <div className="text-center py-20 text-gray-500">Пользователь не найден</div>;

  const { user, specialist, company, supplier, manufacturer, recentPosts, recentPortfolio } = profile;
  const roleInfo = roleLabels[user.role] || roleLabels.USER;
  const gradientIdx = (user.name?.charCodeAt(0) || 0) % avatarGradients.length;
  const socialLinks: Record<string, string> = (() => { try { return JSON.parse(user.socialLinks); } catch { return {}; } })();
  const isOwnProfile = currentUserId === user.id;
  const joinDate = new Date(user.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Cover + Avatar */}
      <div className="relative">
        <div className="h-48 md:h-64 bg-gradient-to-br from-brand-500 via-brand-600 to-orange-500 relative overflow-hidden">
          {user.cover && <img src={user.cover} alt="" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
          <div className="flex flex-col sm:flex-row items-end sm:items-end gap-4">
            {user.avatar ? (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={`w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br ${avatarGradients[gradientIdx]} rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg flex-shrink-0`}>
                {user.name?.charAt(0) || '?'}
              </div>
            )}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{user.name || 'Пользователь'}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleInfo.color}`}>
                  {roleInfo.icon} {roleInfo.label}
                </span>
                {specialist && <span className="text-xs text-gray-500">· {specialistTypes[specialist.type] || specialist.type}</span>}
                {(company?.isVerified || supplier?.isVerified || manufacturer?.isVerified) && (
                  <span className="text-xs text-blue-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    Верифицирован
                  </span>
                )}
              </div>
              {user.bio && <p className="text-gray-600 mt-2 text-sm max-w-xl">{user.bio}</p>}
            </div>
            <div className="flex items-center gap-2 pb-2">
              {!isOwnProfile && currentUserId && (
                <>
                  <FollowButton userId={user.id} />
                  <Link href={`/messages?user=${user.id}`} className="btn-ghost text-sm !px-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    Написать
                  </Link>
                </>
              )}
              {isOwnProfile && (
                <Link href="/dashboard/profile" className="btn-ghost text-sm">Редактировать</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="space-y-5">
            {/* Info card */}
            <div className="card-base p-5 space-y-3">
              <h3 className="font-bold text-gray-900 text-sm">Информация</h3>
              {user.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {user.location}
                </div>
              )}
              {user.website && (
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                  <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 truncate">{user.website}</a>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                Регистрация: {joinDate}
              </div>
              {user.inn && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  ИНН: {user.inn}
                </div>
              )}
            </div>

            {/* Social links */}
            {Object.keys(socialLinks).length > 0 && (
              <div className="card-base p-5 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Соцсети</h3>
                <div className="space-y-2">
                  {Object.entries(socialLinks).map(([key, url]) => url && (
                    <a key={key} href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group">
                      <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm group-hover:bg-brand-50 transition-colors">{socialIcons[key] || '🔗'}</span>
                      <span className="text-sm text-gray-700 group-hover:text-brand-600 transition-colors capitalize">{key}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="card-base p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-xl bg-gray-50">
                  <div className="text-xl font-bold text-gray-900">{user._count.posts}</div>
                  <div className="text-xs text-gray-500">Постов</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50">
                  <div className="text-xl font-bold text-gray-900">{user._count.portfolio}</div>
                  <div className="text-xs text-gray-500">Портфолио</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50">
                  <div className="text-xl font-bold text-gray-900">{user._count.followers}</div>
                  <div className="text-xs text-gray-500">Подписчиков</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50">
                  <div className="text-xl font-bold text-gray-900">{user._count.following}</div>
                  <div className="text-xs text-gray-500">Подписок</div>
                </div>
              </div>
            </div>

            {/* Business info */}
            {company && (
              <div className="card-base p-5 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Компания</h3>
                <Link href={`/companies/${company.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  {company.logo ? (
                    <img src={company.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">К</div>
                  )}
                  <div>
                    <div className="font-medium text-sm text-gray-900">{company.name}</div>
                    {company.isVerified && <span className="text-xs text-blue-500">Верифицирована</span>}
                  </div>
                </Link>
                {company.description && <p className="text-xs text-gray-500 line-clamp-3">{company.description}</p>}
              </div>
            )}

            {supplier && (
              <div className="card-base p-5 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Поставщик</h3>
                <Link href={`/suppliers/${supplier.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  {supplier.logo ? (
                    <img src={supplier.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">П</div>
                  )}
                  <div>
                    <div className="font-medium text-sm text-gray-900">{supplier.companyName}</div>
                    {supplier.isVerified && <span className="text-xs text-blue-500">Верифицирован</span>}
                  </div>
                </Link>
                {supplier.description && <p className="text-xs text-gray-500 line-clamp-3">{supplier.description}</p>}
              </div>
            )}

            {manufacturer && (
              <div className="card-base p-5 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Производство</h3>
                <Link href={`/manufacturers/${manufacturer.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  {manufacturer.logo ? (
                    <img src={manufacturer.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold">М</div>
                  )}
                  <div>
                    <div className="font-medium text-sm text-gray-900">{manufacturer.name}</div>
                    {manufacturer.isVerified && <span className="text-xs text-blue-500">Верифицировано</span>}
                  </div>
                </Link>
                {manufacturer.description && <p className="text-xs text-gray-500 line-clamp-3">{manufacturer.description}</p>}
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Specialist info */}
            {specialist && (
              <div className="card-base p-5 space-y-3">
                <h3 className="font-bold text-gray-900">О специалисте</h3>
                {specialist.description && <p className="text-sm text-gray-600">{specialist.description}</p>}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {specialist.experience != null && <span>Опыт: {specialist.experience} лет</span>}
                  <span>Рейтинг: {specialist.rating.toFixed(1)} ★</span>
                  <span>Тип: {specialistTypes[specialist.type] || specialist.type}</span>
                </div>
              </div>
            )}

            {/* Portfolio */}
            {recentPortfolio.length > 0 && (
              <div className="card-base p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Портфолио</h3>
                  <Link href={`/portfolio/${user.id}`} className="text-sm text-brand-600 hover:text-brand-700">Все →</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {recentPortfolio.map(item => {
                    const imgs: string[] = (() => { try { return JSON.parse(item.images); } catch { return []; } })();
                    return (
                      <Link key={item.id} href={`/portfolio/${user.id}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                        {imgs[0] ? (
                          <img src={imgs[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-white text-sm font-medium">{item.title}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent posts */}
            {recentPosts.length > 0 && (
              <div className="card-base p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Публикации</h3>
                  <Link href={`/feed?authorId=${user.id}`} className="text-sm text-brand-600 hover:text-brand-700">Все →</Link>
                </div>
                <div className="space-y-3">
                  {recentPosts.map(post => (
                    <Link key={post.id} href={`/feed/${post.id}`} className="block p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <h4 className="font-medium text-gray-900 text-sm mb-1">{post.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{post.category}</span>
                        <span>♥ {post.likes}</span>
                        <span>👁 {post.views}</span>
                        <span>💬 {post._count.comments}</span>
                        <span className="ml-auto">{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {recentPosts.length === 0 && recentPortfolio.length === 0 && (
              <div className="card-base p-10 text-center">
                <p className="text-gray-400">Пока нет публикаций</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
