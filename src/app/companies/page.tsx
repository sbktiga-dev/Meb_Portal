'use client';

import { useState, useEffect, useCallback } from 'react';
import Loading from '@/components/Loading';

interface CompanyData {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  isVerified: boolean;
  _count?: { products: number };
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('sort', sortBy);
      const res = await fetch(`/api/companies?${params}`);
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [search, sortBy]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  if (loading) return <Loading text="Загрузка компаний..." />;

  return (
    <div className="min-h-screen">
      <div className="section-container py-10 md:py-14">
        <div className="page-header">
          <h1 className="page-title">Компании</h1>
          <p className="page-subtitle">Мебельные компании, производители, дизайн-студии</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Поиск по названию, адресу..." value={search} onChange={e => setSearch(e.target.value)} className="input-premium pl-11" />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-premium !w-auto !py-2.5">
              <option value="newest">Сначала новые</option>
              <option value="verified">Верифицированные</option>
              <option value="name">По названию</option>
            </select>
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Компании не найдены</h3>
            <p className="text-gray-500">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {companies.map(company => (
              <a key={company.id} href={`/companies/${company.id}`} className="card-base overflow-hidden hover-lift group">
                <div className="h-40 relative overflow-hidden">
                  {company.logo ? (
                    <img src={company.logo} alt={company.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-card flex items-center justify-center text-brand-500 font-bold text-2xl group-hover:scale-110 transition-transform duration-300">
                        {company.name.charAt(0)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg group-hover:text-brand-600 transition-colors">{company.name}</h3>
                    {company.isVerified && <span className="badge-success">ИП</span>}
                  </div>
                  {company.description && <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">{company.description}</p>}
                  <div className="space-y-2 text-sm text-gray-500">
                    {company.address && (
                      <div className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span className="truncate">{company.address}</span>
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                        <span>{company.phone}</span>
                      </div>
                    )}
                    {company.email && (
                      <div className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <span className="truncate">{company.email}</span>
                      </div>
                    )}
                  </div>
                  {company._count?.products ? (
                    <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-400 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                      {company._count.products} товаров
                    </div>
                  ) : null}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
