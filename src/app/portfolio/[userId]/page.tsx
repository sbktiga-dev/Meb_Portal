'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SkeletonGrid } from '@/components/Loading';
import InfiniteScroll from '@/components/InfiniteScroll';
import SendMessageButton from '@/components/SendMessageButton';
import Lightbox from '@/components/Lightbox';

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  images: string;
  category: string | null;
  tags: string;
  createdAt: string;
}

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

const categoryLabels: Record<string, string> = {
  kitchen: 'Кухня',
  bedroom: 'Спальня',
  living: 'Гостиная',
  office: 'Офис',
  bathroom: 'Ванная',
  wardrobe: 'Гардеробная',
  other: 'Другое',
};

const categoryColors: Record<string, string> = {
  kitchen: 'bg-amber-50 text-amber-700 border-amber-200',
  bedroom: 'bg-purple-50 text-purple-700 border-purple-200',
  living: 'bg-blue-50 text-blue-700 border-blue-200',
  office: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  bathroom: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  wardrobe: 'bg-pink-50 text-pink-700 border-pink-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function PublicPortfolioPage() {
  const params = useParams();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.user) setCurrentUserId(d.user.id); })
        .catch(() => {});
    }
  }, []);

  const fetchPortfolio = useCallback(async (pageNum: number, append = false, signal?: AbortSignal) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const catParam = activeCategory ? `&category=${activeCategory}` : '';
      const res = await fetch(`/api/portfolio/user/${params.userId}?page=${pageNum}&limit=12${catParam}`, { signal });
      const data = await res.json();
      if (res.ok) {
        const newItems = data.items || [];
        if (append) {
          setItems(prev => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }
        setUser(data.user || null);
        setHasMore(pageNum < (data.pagination?.totalPages || 1));
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!append) setItems([]);
    }
    finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [params.userId, activeCategory]);

  useEffect(() => {
    const controller = new AbortController();
    setPage(1);
    setHasMore(true);
    fetchPortfolio(1, false, controller.signal);
    return () => controller.abort();
  }, [fetchPortfolio]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPortfolio(nextPage, true);
  }, [page, fetchPortfolio]);

  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[];

  if (loading && items.length === 0) return <SkeletonGrid count={6} />;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="section-container py-10">
        <Link href="/specialists" className="btn-ghost mb-6 -ml-4 animate-fade-in">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад
        </Link>

        <div className="card-base overflow-hidden mb-8 animate-fade-in-up stagger-1">
          <div className="gradient-hero p-5 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0"><div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl animate-float-slow" /></div>
            <div className="relative flex items-center gap-6">
              <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl font-bold border border-white/20 shadow-glass animate-scale-in">
                {user?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Портфолио</h1>
                <p className="text-white/80 mt-1">{user?.name || 'Пользователь'}</p>
                <p className="text-white/60 text-sm mt-1">{items.length} {items.length === 1 ? 'работа' : items.length < 5 ? 'работы' : 'работ'}</p>
              </div>
              <SendMessageButton userId={params.userId as string} />
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 animate-fade-in stagger-2">
            <button
              onClick={() => { setActiveCategory(''); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                !activeCategory ? 'bg-brand-500 text-white shadow-card' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Все
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat ? 'bg-brand-500 text-white shadow-card' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        )}

        {items.length === 0 && !loading ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Портфолио пусто</h3>
            <p className="text-gray-500">Пока нет опубликованных работ</p>
          </div>
        ) : (
          <InfiniteScroll hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {items.map((item, i) => {
                const tags: string[] = (() => { try { return JSON.parse(item.tags); } catch { return []; } })();
                const images: string[] = (() => { try { return JSON.parse(item.images); } catch { return []; } })();
                const isOwner = currentUserId === params.userId;
                return (
                  <div key={item.id} className="card-base overflow-hidden hover-lift animate-fade-in-up">
                    <Link href={`/portfolio/${params.userId}/${item.id}`} className="block">
                      <div className="h-40 sm:h-48 relative group cursor-pointer">
                        {images.length > 0 ? (
                          <Image src={images[0]} alt={item.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" unoptimized />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 flex items-center justify-center">
                            <svg className="w-12 h-12 text-brand-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                          </div>
                        )}
                        {images.length > 1 && (
                          <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">+{images.length - 1}</span>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-1.5 rounded-xl text-xs font-medium shadow-lg">
                            {isOwner ? 'Редактировать' : 'Подробнее'}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-1.5">
                        <h3 className="font-bold text-gray-900 line-clamp-1 text-sm">{item.title}</h3>
                        {item.category && <span className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ml-1 ${categoryColors[item.category] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>{categoryLabels[item.category] || item.category}</span>}
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {tags.slice(0, 2).map(tag => <span key={tag} className="text-[9px] text-brand-600 bg-brand-50 px-1 py-0.5 rounded">#{tag}</span>)}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-[10px] text-gray-400">{new Date(item.createdAt).toLocaleDateString('ru-RU')}</span>
                        {isOwner && (
                          <Link href={`/dashboard/portfolio/${item.id}/edit`}
                            className="text-[10px] text-brand-500 hover:text-brand-700 transition-colors font-medium">
                            Изменить
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </InfiniteScroll>
        )}
      </div>

      {lightbox && (
        <Lightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
