'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface CompanyData {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  avatar: string | null;
  displayName: string;
  userId: string | null;
  isPro: boolean;
  isPremium: boolean;
  categories: string;
  isVerified: boolean;
  phone: string | null;
  email: string | null;
  _count?: { products: number };
}

interface Props {
  initialCompanies: CompanyData[];
  total: number;
  initialCategory: string;
  initialSort: string;
  initialSearch: string;
}

const categories = ['Все', 'Производители', 'Студии', 'Магазины', 'Мастерские'];

export default function CompaniesContent({
  initialCompanies,
  total,
  initialCategory,
  initialSort,
  initialSearch,
}: Props) {
  const router = useRouter();
  const [companies] = useState(initialCompanies);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState(initialSort);

  const updateParams = useCallback((category: string, sort: string, searchValue: string) => {
    const params = new URLSearchParams();
    if (category !== 'Все') params.set('category', category);
    if (sort !== 'newest') params.set('sort', sort);
    if (searchValue) params.set('search', searchValue);
    const query = params.toString();
    router.push(`/companies${query ? `?${query}` : ''}`);
  }, [router]);

  return (
    <div className="min-h-screen">
      <div className="section-container py-10 md:py-14">
        <div className="page-header">
          <h1 className="page-title">Компании</h1>
          <p className="page-subtitle">Каталог мебельных компаний и фабрик</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-5 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Поиск по названию, описанию..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  updateParams(selectedCategory, sortBy, e.target.value);
                }}
                className="input-premium pl-11"
              />
            </div>
            <select value={sortBy} onChange={e => {
              setSortBy(e.target.value);
              updateParams(selectedCategory, e.target.value, search);
            }} className="input-premium !w-auto !py-2.5">
              <option value="newest">Сначала новые</option>
              <option value="verified">Проверенные</option>
              <option value="products">По кол-ву товаров</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  updateParams(cat, sortBy, search);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Компании не найдены</h3>
            <p className="text-gray-500 dark:text-gray-400">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {companies.map(c => (
              <Link
                key={c.id}
                href={c.userId ? `/profile/${c.userId}` : '#'}
                className="card-base p-6 hover-lift group"
              >
                <div className="flex items-start gap-4 mb-4">
                  {c.avatar ? (
                    <div className="w-14 h-14 rounded-2xl overflow-hidden relative shrink-0">
                      <Image src={c.avatar} alt={c.displayName} fill className="object-cover" sizes="56px" unoptimized />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0">
                      {c.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg group-hover:text-brand-600 transition-colors truncate">{c.name}</h3>
                      {c.isVerified && (
                        <svg className="w-5 h-5 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {c.isPremium && <span className="badge-premium text-[10px]">PREMIUM</span>}
                      {c.isPro && !c.isPremium && <span className="badge-pro text-[10px]">PRO</span>}
                    </div>
                  </div>
                </div>
                {c.description && <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">{c.description}</p>}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
                    {c._count?.products ? (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                        {c._count.products} товаров
                      </span>
                    ) : null}
                    {c.categories && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                        {c.categories.split(',')[0]}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
