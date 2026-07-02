'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { SkeletonGrid } from '@/components/Loading';

interface ManufacturerData {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  address: string | null;
  phone: string | null;
  capabilities: string[];
  isVerified: boolean;
}

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<ManufacturerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const fetchManufacturers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        const res = await fetch(`/api/manufacturers?${params}`, { signal: controller.signal });
        const data = await res.json();
        setManufacturers(data.manufacturers || []);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setManufacturers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchManufacturers();
    return () => controller.abort();
  }, [search]);

  if (loading) return <SkeletonGrid count={6} />;

  return (
    <div className="min-h-screen">
      <div className="section-container py-10 md:py-14">
        <div className="page-header">
          <h1 className="page-title">Производства</h1>
          <p className="page-subtitle">Мебельные производства, портфолио работ, технические возможности</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5 md:p-6 mb-8">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Поиск производств..." value={search} onChange={e => setSearch(e.target.value)} className="input-premium pl-11" />
          </div>
        </div>

        {manufacturers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Производства не найдены</h3>
            <p className="text-gray-500">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {manufacturers.map(m => (
              <a key={m.id} href={`/manufacturers/${m.id}`} className="card-base p-6 hover-lift group">
                <div className="flex items-start gap-4 mb-3">
                  {m.logo ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 bg-gray-50 relative">
                      <Image src={m.logo} alt={m.name} fill className="object-contain" sizes="56px" unoptimized />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-brand-50 to-orange-50 rounded-xl flex items-center justify-center text-brand-500 font-bold text-xl flex-shrink-0">
                      {m.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg group-hover:text-brand-600 transition-colors line-clamp-1">{m.name}</h3>
                      {m.isVerified && <span className="badge-success shrink-0">Проверено</span>}
                    </div>
                    {m.description && <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">{m.description}</p>}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {m.capabilities.map(cap => (
                        <span key={cap} className="badge-brand text-[10px]">{cap}</span>
                      ))}
                    </div>
                    {m.address && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 pt-4 border-t border-gray-100">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span className="truncate">{m.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
