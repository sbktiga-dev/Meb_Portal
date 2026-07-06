'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { SkeletonList } from '@/components/Loading';

interface SupplierData {
  id: string;
  companyName: string;
  description: string | null;
  logo: string | null;
  avatar: string | null;
  displayName: string;
  userId: string | null;
  isPro: boolean;
  categories: string;
  isVerified: boolean;
  phone: string | null;
  email: string | null;
  _count?: { products: number };
}

const categories = ['Все', 'Фурнитура', 'ЛДСП', 'Техника', 'Краски', 'Стекло'];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const fetchSuppliers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'Все') params.set('category', selectedCategory);
      if (search) params.set('search', search);
      params.set('sort', sortBy);
      const res = await fetch(`/api/suppliers?${params}`, { signal });
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search, sortBy]);

  useEffect(() => {
    const controller = new AbortController();
    fetchSuppliers(controller.signal);
    return () => controller.abort();
  }, [fetchSuppliers]);

  if (loading) return <SkeletonList count={5} />;

  return (
    <div className="min-h-screen">
      <div className="section-container py-10 md:py-14">
        <div className="page-header">
          <h1 className="page-title">Поставщики</h1>
          <p className="page-subtitle">Каталог поставщиков фурнитуры, материалов и техники</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Поиск по названию, описанию..." value={search} onChange={e => setSearch(e.target.value)} className="input-premium pl-11" />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-premium !w-auto !py-2.5">
              <option value="newest">Сначала новые</option>
              <option value="verified">Проверенные</option>
              <option value="products">По кол-ву товаров</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={selectedCategory === cat ? 'filter-chip-active' : 'filter-chip-inactive'}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {suppliers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Поставщики не найдены</h3>
            <p className="text-gray-500">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {suppliers.map(supplier => {
              const cats: string[] = (() => { try { return JSON.parse(supplier.categories); } catch { return []; } })();
              return (
                <a key={supplier.id} href={supplier.userId ? `/profile/${supplier.userId}` : `/suppliers/${supplier.id}`} className="card-base p-6 hover-lift group">
                  <div className="flex items-start gap-4 mb-3">
                    {(supplier.logo || supplier.avatar) ? (
                      <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 bg-gray-50 relative">
                        <Image src={supplier.logo || supplier.avatar || ''} alt={supplier.companyName} fill className="object-cover" sizes="56px" unoptimized />
                      </div>
                    ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-brand-50 to-orange-50 rounded-xl flex items-center justify-center text-brand-500 font-bold text-xl flex-shrink-0">
                        {supplier.companyName.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-lg group-hover:text-brand-600 transition-colors line-clamp-1">{supplier.displayName || supplier.companyName}</h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {supplier.isPro && <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full text-[10px] font-bold">PRO</span>}
                          {supplier.isVerified && <span className="badge-success">Проверен</span>}
                        </div>
                      </div>
                      {supplier.description && <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">{supplier.description}</p>}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {cats.map(cat => (
                          <span key={cat} className="badge-brand text-[10px]">{cat}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          {supplier._count?.products ? (
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                              {supplier._count.products}
                            </span>
                          ) : null}
                          {supplier.phone && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>}
                          {supplier.email && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                        </div>
                        <span className="text-brand-600 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1">
                          Каталог
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
