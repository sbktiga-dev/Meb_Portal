'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Loading from '@/components/Loading';

interface Follower {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  role: string;
  bio: string | null;
  followedAt: string;
}

export default function FollowersPage() {
  const router = useRouter();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (!data.user) { router.push('/login'); return; }
        return fetch(`/api/users/${data.user.id}/followers`, { headers: { Authorization: `Bearer ${token}` } });
      })
      .then(r => r?.json())
      .then(data => {
        setFollowers(data?.followers || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <Loading text="Загрузка подписчиков..." />;

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto">
        <div className="max-w-3xl">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-brand-500 transition-colors mb-6 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
            Назад
          </Link>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Подписчики</h1>
          <p className="text-gray-500 mb-8">{followers.length} {followers.length === 1 ? 'подписчик' : followers.length < 5 ? 'подписчика' : 'подписчиков'}</p>

          {followers.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Пока нет подписчиков</h3>
              <p className="text-gray-500">Когда кто-то подпишется, он появится здесь</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followers.map(f => (
                <Link key={f.id} href={`/profile/${f.id}`} className="card-base p-4 flex items-center gap-4 hover-lift group">
                  {f.avatar ? (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                      <Image src={f.avatar} alt={f.name || 'Аватар'} fill className="object-cover" sizes="48px" unoptimized />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
                      {f.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">{f.name || 'Без имени'}</p>
                    {f.bio && <p className="text-sm text-gray-500 truncate">{f.bio}</p>}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{new Date(f.followedAt).toLocaleDateString('ru-RU')}</span>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
