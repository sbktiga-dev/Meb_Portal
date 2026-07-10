'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { SkeletonGrid } from '@/components/Loading';
import InfiniteScroll from '@/components/InfiniteScroll';
import BannerAd from '@/components/BannerAd';
import PageSEO from '@/components/PageSEO';

interface ImageData {
  id: string;
  title: string;
  url: string;
  style: string | null;
  category: string | null;
  thumbnail: string | null;
  downloads: number;
  tags: string;
}

interface BannerData {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
}

export default function GalleryPage() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('Все');
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [galleryBanners, setGalleryBanners] = useState<BannerData[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const styles = ['Все', 'Классика', 'Минимализм', 'Лофт', 'Скандинавия', 'Модерн', 'Кантри'];
  const categories = ['Все', 'Кухни', 'Гардеробные', 'Шкафы', 'Столы', 'Стеллажи', 'Детская'];

  const fetchImages = useCallback(async (pageNum: number, append = false, signal?: AbortSignal) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (selectedStyle !== 'Все') params.set('style', selectedStyle);
      if (selectedCategory !== 'Все') params.set('category', selectedCategory);
      if (search) params.set('search', search);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('page', String(pageNum));
      params.set('limit', '20');
      params.set('sort', sortBy);
      const res = await fetch(`/api/images?${params}`, { signal });
      const data = await res.json();
      const newImages = data.images || [];
      if (append) {
        setImages(prev => [...prev, ...newImages]);
      } else {
        setImages(newImages);
      }
      setHasMore(pageNum < (data.pagination?.totalPages || 1));
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!append) setImages([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedStyle, selectedCategory, search, sortBy, dateFrom, dateTo]);

  useEffect(() => {
    const controller = new AbortController();
    setPage(1);
    setHasMore(true);
    fetchImages(1, false, controller.signal);
    return () => controller.abort();
  }, [fetchImages]);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch('/api/auth/me', { headers, signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        const interests = d.user?.interests ? JSON.parse(d.user.interests) : [];
        const params = new URLSearchParams({ position: 'gallery' });
        if (interests.length > 0) params.set('interests', JSON.stringify(interests));
        return fetch(`/api/promotion/active?${params}`, { signal: controller.signal });
      })
      .then(r => r.json())
      .then(data => { if (data.banners) setGalleryBanners(data.banners); })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchImages(nextPage, true);
  }, [page, fetchImages]);

  const activeFilters = (selectedStyle !== 'Все' ? 1 : 0) + (selectedCategory !== 'Все' ? 1 : 0) + (dateFrom || dateTo ? 1 : 0);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <PageSEO title="Каталог изображений" description="Каталог изображений мебельных интерьеров и проектов на МебПортал. Вдохновляйтесь идеями дизайна мебели и интерьеров." />
      <div className="section-container py-10 md:py-14">
        <div className="page-header">
          <h1 className="page-title">Каталог изображений</h1>
          <p className="page-subtitle">{total} изображений в коллекции</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-5 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Поиск по названию, тегам..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="input-premium pl-11"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setPage(1); }}
                className="input-premium !w-auto !py-2.5"
              >
                <option value="newest">Сначала новые</option>
                <option value="popular">По популярности</option>
                <option value="title">По названию</option>
              </select>
              <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3.5 py-2.5 transition-colors ${viewMode === 'grid' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3.5 py-2.5 transition-colors ${viewMode === 'list' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Период:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                className="px-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900 dark:text-gray-100"
              />
              <span className="text-gray-400 dark:text-gray-500">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className="px-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900 dark:text-gray-100"
              />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }} className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 ml-1">Сбросить</button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Стиль:</span>
              <div className="flex gap-1.5">
                {styles.map(s => (
                  <button
                    key={s}
                    onClick={() => { setSelectedStyle(s); setPage(1); }}
                    className={selectedStyle === s ? 'filter-chip-active' : 'filter-chip-inactive'}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-px bg-gray-200 dark:bg-gray-700 hidden md:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">Тип:</span>
              <div className="flex gap-1.5">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => { setSelectedCategory(c); setPage(1); }}
                    className={selectedCategory === c ? 'filter-chip-active' : 'filter-chip-inactive'}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={() => { setSelectedStyle('Все'); setSelectedCategory('Все'); setDateFrom(''); setDateTo(''); setPage(1); }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Сбросить
              </button>
            )}
          </div>
        </div>

        {/* Баннер в каталоге */}
        {galleryBanners.length > 0 && (
          <div className="mb-8">
            <BannerAd title={galleryBanners[0].title} imageUrl={galleryBanners[0].imageUrl} linkUrl={galleryBanners[0].linkUrl} />
          </div>
        )}

        {/* Results */}
        {loading ? (
          <SkeletonGrid count={8} />
        ) : images.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Ничего не найдено</h3>
            <p className="text-gray-500 dark:text-gray-400">Попробуйте изменить параметры поиска</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
            {images.map(img => {
              const tags: string[] = (() => { try { return JSON.parse(img.tags); } catch { return []; } })();
              return (
                <a key={img.id} href={`/gallery/${img.id}`} className="card-base overflow-hidden group hover-lift">
                  <div className="relative bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 h-48 overflow-hidden group-hover:from-brand-100 group-hover:to-orange-100 transition-all duration-500">
                    {img.url ? (
                      <Image src={img.url} alt={img.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-200">
                        <svg className="w-12 h-12 text-brand-300 group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-brand-600 transition-colors truncate">{img.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {img.style && <span className="badge-brand text-[10px]">{img.style}</span>}
                      {img.category && <span className="badge-neutral text-[10px]">{img.category}</span>}
                      {tags.slice(0, 2).map(tag => (
                        <span key={tag} className="badge bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px]">#{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        {img.downloads}
                      </span>
                      <span className="text-brand-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1">
                        Открыть
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {images.map(img => {
              const tags: string[] = (() => { try { return JSON.parse(img.tags); } catch { return []; } })();
              return (
                <a key={img.id} href={`/gallery/${img.id}`} className="flex items-center gap-5 card-base p-4 hover-lift group">
                  <div className="w-20 h-20 bg-gradient-to-br from-brand-50 to-orange-50 rounded-xl flex items-center justify-center text-brand-200 shrink-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold group-hover:text-brand-600 transition-colors truncate">{img.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {img.style && <span className="badge-brand text-[10px]">{img.style}</span>}
                      {img.category && <span className="badge-neutral text-[10px]">{img.category}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1 justify-end">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                      {img.downloads}
                    </span>
                    <div className="text-brand-600 text-sm font-semibold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Открыть →</div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Infinite scroll */}
        <InfiniteScroll hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore} />
      </div>
    </div>
  );
}
