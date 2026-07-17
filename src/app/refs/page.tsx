'use client';

import { useState, useEffect } from 'react';
import { SkeletonList } from '@/components/Loading';
import PageSEO from '@/components/PageSEO';
import { downloadPdf } from '@/lib/pdf';

interface RefData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: Record<string, string[]> | { _type: string; sections: { title: string; text: string }[] };
}

const categories = ['Все', 'Размеры', 'Нормы', 'Фурнитура', 'Материалы', 'ГОСТ'];

function isTextContent(content: RefData['content']): content is { _type: string; sections: { title: string; text: string }[] } {
  return typeof content === 'object' && content !== null && '_type' in content && (content as Record<string, unknown>)._type === 'text';
}

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
    <div className="min-h-screen dark:bg-gray-900">
      <PageSEO title="Справочники" description="Справочники мебельной индустрии на МебПортал: размеры, нормы, фурнитура, материалы, ГОСТы. Полезная информация для специалистов." />
      <div className="section-container py-10 md:py-14">
        <div className="page-header">
          <h1 className="page-title">Справочники</h1>
          <p className="page-subtitle">Технические таблицы, нормы, паспорта фурнитуры, ГОСТы</p>
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
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${expandedId === ref.id ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-500'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 transition-colors">{ref.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="badge-neutral text-[10px]">{ref.category}</span>
                      {ref.description && <span className="text-xs text-gray-400 dark:text-gray-500">{ref.description}</span>}
                    </div>
                  </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${expandedId === ref.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              {expandedId === ref.id && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-5 animate-fade-in">
                  <div className="flex justify-end mb-3">
                    <button
                      onClick={() => {
                        if (isTextContent(ref.content)) {
                          const sections = ref.content.sections.map(s => ({ heading: s.title, content: s.text }));
                          downloadPdf(ref.title, sections);
                        } else {
                          const sections = Object.entries(ref.content).map(([key, values]) => ({
                            heading: key,
                            content: Array.isArray(values) ? values.join(' / ') : String(values),
                          }));
                          downloadPdf(ref.title, sections);
                        }
                      }}
                      className="btn-secondary text-xs !px-3 !py-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      PDF
                    </button>
                  </div>

                  {/* Text content (GOST, articles, etc.) */}
                  {isTextContent(ref.content) ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {ref.content.sections.map((section, i) => (
                        <div key={i} className="mb-6 last:mb-0">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                            {section.title}
                          </h3>
                          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                            {section.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Table content (traditional references) */
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50/80 dark:bg-gray-700/50">
                            <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Наименование</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider">Значение</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(ref.content).map(([key, values], i) => (
                            <tr key={i} className="border-t border-gray-50 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{key}</td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{Array.isArray(values) ? values.join(' / ') : String(values)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {refs.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Справочники не найдены</h3>
            <p className="text-gray-500 dark:text-gray-400">Попробуйте изменить параметры поиска</p>
          </div>
        )}
      </div>
    </div>
  );
}
