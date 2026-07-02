'use client';

import { useState, useEffect } from 'react';
import { SkeletonList } from '@/components/Loading';

interface RefData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: Record<string, string[]>;
}

const categories = ['Все', 'Размеры', 'Нормы', 'Фурнитура', 'Материалы'];

export default function RefsPage() {
  const [refs, setRefs] = useState<RefData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchRefs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'Все') params.set('category', selectedCategory);
        const res = await fetch(`/api/refs?${params}`, { signal: controller.signal });
        const data = await res.json();
        setRefs(data.references || []);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setRefs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRefs();
    return () => controller.abort();
  }, [selectedCategory]);

  if (loading) return <SkeletonList count={4} />;

  return (
    <div className="min-h-screen">
      <div className="section-container py-10 md:py-14">
        <div className="page-header">
          <h1 className="page-title">Справочники</h1>
          <p className="page-subtitle">Технические таблицы, нормы, паспорта фурнитуры</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={selectedCategory === cat ? 'filter-chip-active' : 'filter-chip-inactive'}>
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {refs.map(ref => (
            <div key={ref.id} className="card-base overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === ref.id ? null : ref.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${expandedId === ref.id ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-500'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{ref.title}</h3>
                    <span className="badge-neutral text-[10px] mt-1">{ref.category}</span>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedId === ref.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              {expandedId === ref.id && (
                <div className="border-t border-gray-100 p-5 animate-fade-in">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/80">
                          <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs tracking-wider">Наименование</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs tracking-wider">Значение</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(ref.content).map(([key, values], i) => (
                          <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-700">{key}</td>
                            <td className="px-4 py-3 text-gray-500">{Array.isArray(values) ? values.join(' / ') : String(values)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {refs.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Справочники не найдены</h3>
            <p className="text-gray-500">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </div>
  );
}
