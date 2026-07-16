'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SkeletonGrid } from '@/components/Loading';
import InfiniteScroll from '@/components/InfiniteScroll';
import PageSEO from '@/components/PageSEO';
import { useCompare } from '@/components/CompareProvider';
import { useDebounce } from '@/hooks/useDebounce';
import FavoriteButton from '@/components/FavoriteButton';
import BannerPlaceholder from '@/components/BannerPlaceholder';

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  images: string;
  category: string;
  brand: string | null;
  specs: string;
  createdAt: string;
  company: { id: string; name: string; logo: string | null } | null;
  supplier: { id: string; companyName: string; logo: string | null } | null;
  manufacturer: { id: string; name: string; logo: string | null } | null;
  _count: { reviews: number };
  avgRating: number;
}

const categories = ['Все', 'Кухни', 'Шкафы', 'Столы', 'Стеллажи', 'Диваны', 'Кровати', 'Фурнитура', 'Материалы'];
const sortOptions = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'popular', label: 'По популярности' },
  { value: 'price_asc', label: 'Сначала дешёвые' },
  { value: 'price_desc', label: 'Сначала дорогие' },
  { value: 'name', label: 'По названию' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [category, setCategory] = useState('Все');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { items: compareIds, add: compareAdd, remove: compareRemove, has: compareHas } = useCompare();

  const fetchProducts = useCallback(async (pageNum: number, append = false, signal?: AbortSignal) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (category !== 'Все') params.set('category', category);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (minRating) params.set('minRating', minRating);
      params.set('sort', sortBy);
      params.set('page', String(pageNum));
      params.set('limit', '20');
      const res = await fetch(`/api/products?${params}`, { signal });
      const data = await res.json();
      const newProducts = data.products || [];
      if (append) setProducts(prev => [...prev, ...newProducts]);
      else setProducts(newProducts);
      setHasMore(pageNum < (data.pagination?.totalPages || 1));
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!append) setProducts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, category, sortBy, minPrice, maxPrice, minRating]);

  useEffect(() => {
    const controller = new AbortController();
    setPage(1);
    setHasMore(true);
    fetchProducts(1, false, controller.signal);
    return () => controller.abort();
  }, [fetchProducts]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  }, [page, fetchProducts]);

  const toggleCompare = (id: string) => {
    if (compareHas(id)) compareRemove(id);
    else compareAdd(id);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Цена не указана';
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="min-h-screen">
      <PageSEO title="Каталог товаров" description="Каталог мебельных товаров на МебПортал: кухни, шкафы, столы, стеллажи, диваны, кровати, фурнитура и материалы от лучших производителей." />
      <div className="section-container py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Каталог товаров</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{total} товаров в каталоге</p>
          </div>
          {compareIds.length >= 2 && (
            <Link href={`/products/compare?ids=${compareIds.join(',')}`} className="btn-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              Сравнить ({compareIds.length})
            </Link>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-5 md:p-6 mb-8 animate-fade-in-up stagger-1">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Поиск товаров..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="input-premium pl-11"
              />
            </div>
            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} className="input-premium !w-auto !py-2.5">
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map(c => (
              <button key={c} onClick={() => { setCategory(c); setPage(1); }} className={category === c ? 'filter-chip-active' : 'filter-chip-inactive'}>
                {c}
              </button>
            ))}
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="filter-chip-inactive flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
              Фильтры
            </button>
          </div>
          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Цена, ₽</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="От" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="input-premium text-sm !py-2" />
                  <input type="number" placeholder="До" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="input-premium text-sm !py-2" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Минимальный рейтинг</label>
                <select value={minRating} onChange={e => setMinRating(e.target.value)} className="input-premium text-sm !py-2">
                  <option value="">Любой</option>
                  <option value="4">4+</option>
                  <option value="3">3+</option>
                  <option value="2">2+</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); setMinRating(''); setPage(1); }} className="btn-ghost text-sm w-full">
                  Сбросить фильтры
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3-column layout with sidebars */}
      <div className="px-[5mm]">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-[76px]">
          {/* Left sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <BannerPlaceholder key={`products-left-${i}`} />
              ))}
            </div>
          </aside>

          {/* Center content */}
          <div className="min-w-0">
        {loading ? (
          <SkeletonGrid count={8} />
        ) : products.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Товаров не найдено</h3>
            <p className="text-gray-500 dark:text-gray-400">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, i) => {
              const productImages: string[] = (() => { try { return JSON.parse(product.images); } catch { return []; } })();
              const isCompared = compareHas(product.id);
              return (
                <div key={product.id} className={`card-base overflow-hidden hover-lift animate-fade-in-up stagger-${Math.min((i % 6) + 1, 6)} ${isCompared ? 'ring-2 ring-brand-500' : ''}`}>
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
                      {productImages.length > 0 ? (
                        <Image src={productImages[0]} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                        </div>
                      )}
                      {product.brand && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 backdrop-blur-sm">
                          {product.brand}
                        </span>
                      )}
                      <div className="absolute top-3 right-3">
                        <FavoriteButton itemType="product" itemId={product.id} compact />
                      </div>
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-brand-600 transition-colors line-clamp-2">{product.name}</h3>
                    </Link>
                    {/* Поставщик / Производитель / Компания */}
                    {(product.company || product.supplier || product.manufacturer) && (
                      <div className="flex items-center gap-2 mt-2">
                        {(product.company || product.manufacturer) && (
                          <div className="flex items-center gap-1.5">
                            {product.company?.logo || product.manufacturer?.logo ? (
                              <div className="relative w-5 h-5 rounded-full overflow-hidden">
                                <Image src={product.company?.logo || product.manufacturer?.logo || ''} alt="" fill className="object-cover" sizes="20px" unoptimized />
                              </div>
                            ) : (
                              <div className="w-5 h-5 bg-gradient-to-br from-brand-400 to-orange-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                                {(product.company?.name || product.manufacturer?.name || '').charAt(0)}
                              </div>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{product.company?.name || product.manufacturer?.name}</span>
                          </div>
                        )}
                        {product.supplier && (
                          <div className="flex items-center gap-1.5">
                            {product.supplier.logo ? (
                              <div className="relative w-5 h-5 rounded-full overflow-hidden">
                                <Image src={product.supplier.logo} alt="" fill className="object-cover" sizes="20px" unoptimized />
                              </div>
                            ) : (
                              <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold">
                                {product.supplier.companyName.charAt(0)}
                              </div>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{product.supplier.companyName}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {product.avgRating > 0 && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{product.avgRating.toFixed(1)}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">({product._count.reviews})</span>
                        </div>
                      )}
                      <span className="badge-neutral text-[10px]">{product.category}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="font-bold text-brand-600">{formatPrice(product.price)}</span>
                      <button
                        onClick={(e) => { e.preventDefault(); toggleCompare(product.id); }}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${isCompared ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                      >
                        {isCompared ? 'Убрать' : 'Сравнить'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
          </div>

          {/* Right sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <BannerPlaceholder key={`products-right-${i}`} />
              ))}
            </div>
          </aside>
        </div>
      </div>

      <InfiniteScroll hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore} />
    </div>
  );
}
