'use client';

import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SkeletonFeed } from '@/components/Loading';
import FollowButton from '@/components/FollowButton';
import Lightbox from '@/components/Lightbox';
import RoleBadge from '@/components/RoleBadge';
import PromotionBadge from '@/components/PromotionBadge';
import BannerAd from '@/components/BannerAd';
import { getDisplayName, getDisplayInitial } from '@/lib/displayName';

interface PostData {
  id: string;
  title: string;
  content: string;
  category: string;
  images: string;
  tags: string;
  likes: number;
  views: number;
  createdAt: string;
  author: { id: string; name: string | null; email: string; avatar: string | null; role?: string };
  _count: { comments: number; likesList: number };
  isPromoted?: boolean;
}

interface BannerData {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
}

const categoryLabels: Record<string, { label: string; color: string; bg: string }> = {
  news: { label: 'Новость', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  project: { label: 'Проект', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
  article: { label: 'Статья', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
  product: { label: 'Товар', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
};

const avatarGradients = [
  'from-brand-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-purple-400 to-pink-500',
  'from-blue-400 to-indigo-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-500',
];

export default function FeedPage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState('all');
  const [feedFilter, setFeedFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [repostedPosts, setRepostedPosts] = useState<Set<string>>(new Set());
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [promotedPosts, setPromotedPosts] = useState<PostData[]>([]);
  const [feedBanners, setFeedBanners] = useState<BannerData[]>([]);
  const [search, setSearch] = useState('');
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAuthorId(params.get('authorId'));
  }, []);

  const fetchPosts = useCallback(async (pageNum: number, append = false, signal?: AbortSignal) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const authorParam = authorId ? `&authorId=${authorId}` : '';
      const filterParam = feedFilter === 'subscriptions' ? '&filter=subscriptions' : '';
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(`/api/feed?category=${category}&sort=${sort}&page=${pageNum}&limit=10${authorParam}${filterParam}${search ? `&search=${encodeURIComponent(search)}` : ''}`, { headers, signal });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const newPosts = data.posts || [];
      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }
      if (data.likedPostIds?.length) {
        setLikedPosts(prev => {
          const next = new Set(prev);
          data.likedPostIds.forEach((id: string) => next.add(id));
          return next;
        });
      }
      setHasMore(pageNum < (data.pagination?.totalPages || 1));
      setFeedError(null);

      if (!append && data.promotedPosts) {
        setPromotedPosts(data.promotedPosts);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!append) {
        setPosts([]);
        setFeedError('Не удалось загрузить ленту. Попробуйте обновить страницу.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, sort, authorId, feedFilter, search]);

  useEffect(() => {
    const controller = new AbortController();
    setPage(1);
    setHasMore(true);
    fetchPosts(1, false, controller.signal);
    return () => controller.abort();
  }, [fetchPosts]);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch('/api/auth/me', { headers, signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        const interests = d.user?.interests ? JSON.parse(d.user.interests) : [];
        const params = new URLSearchParams({ position: 'feed' });
        if (interests.length > 0) params.set('interests', JSON.stringify(interests));
        return fetch(`/api/promotion/active?${params}`, { signal: controller.signal });
      })
      .then(r => r.json())
      .then(data => { if (data.banners) setFeedBanners(data.banners); })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchPosts(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchPosts]);

  const handleLike = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      const hasCookie = document.cookie.includes('token=');
      if (!hasCookie) { window.location.href = '/login'; return; }
    }
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers,
      });
      const data = await res.json();
      if (res.ok) {
        setLikedPosts(prev => {
          const next = new Set(prev);
          if (data.liked) next.add(postId);
          else next.delete(postId);
          return next;
        });
        setPosts(prev => prev.map(p => p.id === postId ? {
          ...p,
          likes: data.likes,
          _count: { ...p._count, likesList: data.likes },
        } : p));
      }
    } catch {}
  };

  const handleRepost = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`/api/posts/${postId}/repost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRepostedPosts(prev => {
          const next = new Set(prev);
          next.add(postId);
          return next;
        });
      }
    } catch {
      // Repost failed silently
    }
  };

  return (
    <div className="min-h-screen">
      <div className="section-container py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Лента новостей</h1>
            <p className="text-gray-500 mt-1">Публикации от участников сообщества</p>
          </div>
          <Link href="/feed/new" className="btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Создать пост
          </Link>
        </div>

        <div className="mb-6 animate-fade-in-up stagger-1">
          <div className="relative max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Поиск по заголовку, содержанию, тегам..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-8 animate-fade-in-up stagger-1">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Все' },
              { key: 'subscriptions', label: 'Подписки' },
              { key: 'news', label: 'Новости' },
              { key: 'project', label: 'Проекты' },
              { key: 'article', label: 'Статьи' },
              { key: 'product', label: 'Товары' },
            ].map(c => (
              <button key={c.key} onClick={() => {
                if (c.key === 'subscriptions') {
                  setFeedFilter('subscriptions');
                  setCategory('all');
                } else {
                  setFeedFilter('all');
                  setCategory(c.key);
                }
                setPage(1);
              }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  (c.key === 'subscriptions' && feedFilter === 'subscriptions') ||
                  (c.key !== 'subscriptions' && feedFilter === 'all' && category === c.key)
                    ? 'bg-brand-500 text-white shadow-card'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}>
                {c.label}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
            className="ml-auto px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
            <option value="newest">Новые</option>
            <option value="popular">Популярные</option>
            <option value="discussed">Обсуждаемые</option>
          </select>
        </div>

        {loading ? (
          <SkeletonFeed count={3} />
        ) : feedError ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{feedError}</h3>
            <button onClick={() => { setFeedError(null); fetchPosts(1, false); }} className="btn-primary mt-4">Попробовать снова</button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Пока нет публикаций</h3>
            <p className="text-gray-500 mb-6">Будьте первым — создайте пост!</p>
            <Link href="/feed/new" className="btn-primary">Создать первый пост</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-6">
            {/* Left sidebar — баннеры на десктопе */}
            <aside className="hidden lg:block">
              {feedBanners.length > 0 && (
                <div className="sticky top-20 space-y-4">
                  {feedBanners.map((b) => (
                    <BannerAd key={b.id} title={b.title} imageUrl={b.imageUrl} linkUrl={b.linkUrl} />
                  ))}
                </div>
              )}
            </aside>

            {/* Center — посты */}
            <div className="space-y-8 min-w-0">
            {/* Продвинутые посты */}
            {promotedPosts.map((post, i) => {
              const tags: string[] = (() => { try { return JSON.parse(post.tags); } catch { return []; } })();
              const postImages: string[] = (() => { try { return JSON.parse(post.images); } catch { return []; } })();
              const cat = categoryLabels[post.category] || categoryLabels.news;
              const gradientIdx = (post.author.name?.charCodeAt(0) || 0) % avatarGradients.length;
              const isLiked = likedPosts.has(post.id);
              const timeAgo = getTimeAgo(post.createdAt);

              return (
                <article key={`promoted-${post.id}`} className="card-base overflow-hidden animate-fade-in-up border-amber-200">
                  <div className="bg-amber-50 px-5 py-2 border-b border-amber-100">
                    <PromotionBadge />
                  </div>
                  <div className="flex items-center gap-3 p-5 pb-0">
                    <div className="relative w-11 h-11 flex-shrink-0">
                      {post.author.avatar ? (
                        <div className="w-11 h-11 rounded-full border-2 border-white shadow-sm overflow-hidden">
                          <Image src={post.author.avatar} alt="" width={44} height={44} className="w-full h-full object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className={`w-11 h-11 bg-gradient-to-br ${avatarGradients[gradientIdx]} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                          {getDisplayInitial(post.author.name, post.author.role)}
                        </div>
                      )}
                      <RoleBadge role={post.author.role || 'USER'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">{getDisplayName(post.author.name, post.author.role)}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${cat.color}`}>{cat.label}</span>
                      </div>
                      <span className="text-xs text-gray-400">{timeAgo}</span>
                    </div>
                    <FollowButton userId={post.author.id} compact />
                    <Link href={`/feed/${post.id}`} className="text-gray-400 hover:text-brand-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </Link>
                  </div>
                  <div className="px-5 pt-4 pb-3">
                    <Link href={`/feed/${post.id}`}>
                      <h2 className="text-lg font-bold text-gray-900 mb-2 hover:text-brand-600 transition-colors leading-snug">{post.title}</h2>
                    </Link>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{post.content}</p>
                  </div>
                  {postImages.length > 0 && (
                    <div className="block cursor-pointer" onClick={() => setLightbox({ images: postImages, index: 0 })}>
                      <div className="relative bg-gray-50">
                        {postImages.length === 1 ? (
                          <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                            <Image src={postImages[0]} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" unoptimized />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-0.5">
                            {postImages.slice(0, 4).map((img, idx) => (
                              <div key={idx} className="relative" style={{ paddingBottom: '100%' }}>
                                <Image src={img} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 320px" unoptimized />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div className="px-5 pt-3 flex flex-wrap gap-1.5">
                      {tags.slice(0, 5).map(tag => <span key={tag} className="text-xs text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full font-medium">#{tag}</span>)}
                    </div>
                  )}
                  <div className="flex items-center gap-1 px-5 py-3 border-t border-gray-100 mt-3">
                    <button onClick={(e) => handleLike(post.id, e)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isLiked ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                      <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                      {post.likes}
                    </button>
                    <Link href={`/feed/${post.id}`} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      {post._count.comments}
                    </Link>
                    <span className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      {post.views}
                    </span>
                  </div>
                </article>
              );
            })}

            {/* Баннер после продвинутых — только на мобильном */}
            {promotedPosts.length > 0 && feedBanners.length > 0 && (
              <div className="lg:hidden">
                <BannerAd title={feedBanners[0].title} imageUrl={feedBanners[0].imageUrl} linkUrl={feedBanners[0].linkUrl} />
              </div>
            )}

            {/* Обычные посты */}
            {posts.map((post, i) => {
              const tags: string[] = (() => { try { return JSON.parse(post.tags); } catch { return []; } })();
              const postImages: string[] = (() => { try { return JSON.parse(post.images); } catch { return []; } })();
              const cat = categoryLabels[post.category] || categoryLabels.news;
              const gradientIdx = (post.author.name?.charCodeAt(0) || 0) % avatarGradients.length;
              const isLiked = likedPosts.has(post.id);
              const timeAgo = getTimeAgo(post.createdAt);

              return (
                <Fragment key={post.id}>
                <article className={`card-base overflow-hidden animate-fade-in-up stagger-${Math.min((i % 5) + 1, 6)}`}>
                  {/* Header */}
                  <div className="flex items-center gap-3 p-5 pb-0">
                    <div className="relative w-11 h-11 flex-shrink-0">
                      {post.author.avatar ? (
                        <div className="w-11 h-11 rounded-full border-2 border-white shadow-sm overflow-hidden">
                          <Image src={post.author.avatar} alt="" width={44} height={44} className="w-full h-full object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className={`w-11 h-11 bg-gradient-to-br ${avatarGradients[gradientIdx]} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                          {getDisplayInitial(post.author.name, post.author.role)}
                        </div>
                      )}
                      <RoleBadge role={post.author.role || 'USER'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">{getDisplayName(post.author.name, post.author.role)}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${cat.color}`}>{cat.label}</span>
                      </div>
                      <span className="text-xs text-gray-400">{timeAgo}</span>
                    </div>
                    <FollowButton userId={post.author.id} compact />
                    <Link href={`/feed/${post.id}`} className="text-gray-400 hover:text-brand-500 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </Link>
                  </div>

                  {/* Content */}
                  <div className="px-5 pt-4 pb-3">
                    <Link href={`/feed/${post.id}`}>
                      <h2 className="text-lg font-bold text-gray-900 mb-2 hover:text-brand-600 transition-colors leading-snug">{post.title}</h2>
                    </Link>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{post.content}</p>
                  </div>

                  {/* Images — vertical stack */}
                  {postImages.length > 0 && (
                    <div className="block cursor-pointer" onClick={() => setLightbox({ images: postImages, index: 0 })}>
                      <div className="relative bg-gray-50">
                        {postImages.length === 1 ? (
                          <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                            <Image src={postImages[0]} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" unoptimized />
                          </div>
                        ) : postImages.length === 2 ? (
                          <div className="grid grid-cols-2 gap-0.5">
                            {postImages.slice(0, 2).map((img, idx) => (
                              <div key={idx} className="relative" style={{ paddingBottom: '100%' }}>
                                <Image src={img} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 320px" unoptimized />
                              </div>
                            ))}
                          </div>
                        ) : postImages.length === 3 ? (
                          <div className="grid grid-cols-2 gap-0.5">
                            <div className="relative row-span-2" style={{ paddingBottom: '200%' }}>
                              <Image src={postImages[0]} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 320px" unoptimized />
                            </div>
                            {postImages.slice(1, 3).map((img, idx) => (
                              <div key={idx} className="relative" style={{ paddingBottom: '100%' }}>
                                <Image src={img} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 320px" unoptimized />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-0.5">
                            {postImages.slice(0, 4).map((img, idx) => (
                              <div key={idx} className="relative" style={{ paddingBottom: '100%' }}>
                                <Image src={img} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 320px" unoptimized />
                                {idx === 3 && postImages.length > 4 && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white text-xl font-bold">+{postImages.length - 4}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="px-5 pt-3 flex flex-wrap gap-1.5">
                      {tags.slice(0, 5).map(tag => <span key={tag} className="text-xs text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full font-medium">#{tag}</span>)}
                      {tags.length > 5 && <span className="text-xs text-gray-400">+{tags.length - 5}</span>}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 px-5 py-3 border-t border-gray-100 mt-3">
                    <button onClick={(e) => handleLike(post.id, e)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isLiked ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-50'}`}>
                      <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                      {post.likes}
                    </button>
                    <Link href={`/feed/${post.id}`} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      {post._count.comments}
                    </Link>
                    <button
                      onClick={(e) => handleRepost(post.id, e)}
                      disabled={repostedPosts.has(post.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${repostedPosts.has(post.id) ? 'text-emerald-500 bg-emerald-50' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                      {repostedPosts.has(post.id) ? 'Репостнуто' : 'Репост'}
                    </button>
                    <span className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      {post.views}
                    </span>
                  </div>
                </article>
                {(i + 1) % 3 === 0 && feedBanners.length > 0 && (
                  <div className="lg:hidden">
                    <BannerAd title={feedBanners[i % feedBanners.length].title} imageUrl={feedBanners[i % feedBanners.length].imageUrl} linkUrl={feedBanners[i % feedBanners.length].linkUrl} />
                  </div>
                )}
                </Fragment>
              );
            })}

            {/* Infinite scroll sentinel */}
            <div ref={observerRef} className="py-8">
              {loadingMore && (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">Загрузка ещё...</span>
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <p className="text-center text-sm text-gray-400">Все посты загружены</p>
              )}
            </div>
          </div>

            {/* Right sidebar — баннеры на десктопе */}
            <aside className="hidden lg:block">
              {feedBanners.length > 1 && (
                <div className="sticky top-20 space-y-4">
                  {feedBanners.slice(1).map((b) => (
                    <BannerAd key={b.id} title={b.title} imageUrl={b.imageUrl} linkUrl={b.linkUrl} />
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>

      {lightbox && (
        <Lightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн. назад`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
