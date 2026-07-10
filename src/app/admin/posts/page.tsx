'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/components/Loading';
import Image from 'next/image';

interface PostData {
  id: string;
  title: string;
  content: string;
  category: string;
  images: string;
  tags: string;
  likes: number;
  views: number;
  isPublished: boolean;
  createdAt: string;
  author: { id: string; name: string | null; email: string; avatar: string | null };
  _count: { comments: number; likesList: number };
}

const categoryLabels: Record<string, { label: string; color: string }> = {
  news: { label: 'Новость', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  project: { label: 'Проект', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  article: { label: 'Статья', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  product: { label: 'Товар', color: 'bg-amber-50 text-amber-600 border-amber-100' },
};

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        if (d.user?.role !== 'ADMIN') { router.push('/dashboard'); return; }
        setAuthChecked(true);
      })
      .catch(() => router.push('/login'));
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    const controller = new AbortController();
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/admin/posts?filter=${filter}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await res.json();
        setPosts(data.posts || []);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Ошибка загрузки данных');
        setPosts([]);
      }
      setLoading(false);
    };
    fetchPosts();
    return () => controller.abort();
  }, [filter, authChecked]);

  const handleToggle = async (postId: string, isPublished: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setActionLoading(postId);
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, isPublished }),
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPublished } : p));
      }
    } catch {}
    setActionLoading(null);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Удалить пост навсегда?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/admin/posts?postId=${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch {}
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen py-10">
      <div className="section-container">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Модерация постов</h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 ml-8">Публикации пользователей</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 animate-fade-in-up stagger-1">
          {[
            { key: 'all', label: 'Все' },
            { key: 'published', label: 'Опубликованы' },
            { key: 'hidden', label: 'Скрыты' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.key ? 'bg-brand-500 text-white shadow-card' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Loading text="Загрузка постов..." />
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={() => { setError(null); window.location.reload(); }} className="text-brand-500 hover:underline">Попробовать снова</button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Нет постов</h3>
            <p className="text-gray-500 dark:text-gray-400">Пока нет публикаций для модерации</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => {
              const cat = categoryLabels[post.category] || categoryLabels.news;
              const postImages: string[] = (() => { try { return JSON.parse(post.images); } catch { return []; } })();
              return (
                <div key={post.id} className={`card-base overflow-hidden animate-fade-in-up stagger-${Math.min(i + 1, 6)} ${!post.isPublished ? 'border-l-4 border-l-amber-400' : ''}`}>
                  <div className="flex flex-col sm:flex-row">
                    {postImages.length > 0 && (
                      <div className="relative sm:w-48 h-32 sm:h-auto flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                        <Image src={postImages[0]} alt="" fill className="object-cover" sizes="(max-width: 640px) 100vw, 192px" unoptimized />
                      </div>
                    )}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Link href={`/feed/${post.id}`} className="font-bold text-gray-900 dark:text-gray-100 hover:text-brand-600 transition-colors line-clamp-1">{post.title}</Link>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${cat.color}`}>{cat.label}</span>
                            {!post.isPublished && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200">Скрыт</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{post.content}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                            <span className="flex items-center gap-1">
                              {post.author.avatar ? (
                                <div className="relative w-5 h-5 rounded-full overflow-hidden">
                                  <Image src={post.author.avatar} alt="" fill className="object-cover" sizes="20px" unoptimized />
                                </div>
                              ) : (
                                <div className="w-5 h-5 bg-gradient-to-br from-brand-400 to-orange-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                                  {post.author.name?.charAt(0) || '?'}
                                </div>
                              )}
                              {post.author.name || 'Аноним'}
                            </span>
                            <span>{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
                            <span>{post._count.likesList} лайков</span>
                            <span>{post._count.comments} комментариев</span>
                            <span>{post.views} просмотров</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleToggle(post.id, !post.isPublished)}
                            disabled={actionLoading === post.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 ${
                              post.isPublished
                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {actionLoading === post.id ? '...' : post.isPublished ? 'Скрыть' : 'Одобрить'}
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            disabled={actionLoading === post.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all disabled:opacity-50"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
