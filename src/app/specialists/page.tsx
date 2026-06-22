'use client';

import { useState, useEffect, useCallback } from 'react';
import Loading from '@/components/Loading';

interface SpecialistData {
  id: string;
  type: string;
  description: string | null;
  experience: number | null;
  rating: number;
  portfolio: string | null;
  user: { name: string | null; email: string };
}

const types = ['Все', 'DESIGNER', 'TECHNOLOGIST', 'INSTALLER', 'MANAGER'];
const typeLabels: Record<string, string> = { DESIGNER: 'Дизайнер', TECHNOLOGIST: 'Технолог', INSTALLER: 'Установщик', MANAGER: 'Менеджер' };
const typeIcons: Record<string, React.ReactNode> = {
  DESIGNER: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>,
  TECHNOLOGIST: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>,
  INSTALLER: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>,
  MANAGER: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
};
const typeColors: Record<string, string> = {
  DESIGNER: 'bg-purple-50 text-purple-600',
  TECHNOLOGIST: 'bg-blue-50 text-blue-600',
  INSTALLER: 'bg-emerald-50 text-emerald-600',
  MANAGER: 'bg-amber-50 text-amber-600',
};

export default function SpecialistsPage() {
  const [specialists, setSpecialists] = useState<SpecialistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('Все');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  const fetchSpecialists = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'Все') params.set('type', selectedType);
      if (search) params.set('search', search);
      params.set('sort', sortBy);
      const res = await fetch(`/api/specialists?${params}`);
      const data = await res.json();
      setSpecialists(data.specialists || []);
    } catch {
      setSpecialists([]);
    } finally {
      setLoading(false);
    }
  }, [selectedType, search, sortBy]);

  useEffect(() => { fetchSpecialists(); }, [fetchSpecialists]);

  if (loading) return <Loading text="Загрузка специалистов..." />;

  return (
    <div className="min-h-screen">
      <div className="section-container py-10 md:py-14">
        <div className="page-header">
          <h1 className="page-title">Специалисты</h1>
          <p className="page-subtitle">Дизайнеры, технологи, установщики, менеджеры</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Поиск по имени, описанию..." value={search} onChange={e => setSearch(e.target.value)} className="input-premium pl-11" />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-premium !w-auto !py-2.5">
              <option value="rating">По рейтингу</option>
              <option value="experience">По опыту</option>
              <option value="newest">Сначала новые</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {types.map(t => (
              <button key={t} onClick={() => setSelectedType(t)} className={`${selectedType === t ? 'filter-chip-active' : 'filter-chip-inactive'} inline-flex items-center gap-1.5`}>
                {t !== 'Все' && typeIcons[t]}
                {t === 'Все' ? 'Все' : typeLabels[t] || t}
              </button>
            ))}
          </div>
        </div>

        {specialists.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Специалисты не найдены</h3>
            <p className="text-gray-500">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {specialists.map(s => (
              <a key={s.id} href={`/specialists/${s.id}`} className="card-base p-6 hover-lift group">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${typeColors[s.type] || 'bg-gray-100 text-gray-600'}`}>
                    {typeIcons[s.type] || s.user.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg group-hover:text-brand-600 transition-colors truncate">{s.user.name}</h3>
                    <span className="badge-brand text-[10px] mt-1">
                      {typeLabels[s.type] || s.type}
                    </span>
                  </div>
                </div>
                {s.description && <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">{s.description}</p>}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {s.experience || 0} лет
                    </span>
                    {s.portfolio && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                        Портфолио
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <span className="font-bold text-gray-900">{s.rating.toFixed(1)}</span>
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
