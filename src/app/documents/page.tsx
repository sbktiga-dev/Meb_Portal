'use client';

import { useState, useEffect, useCallback } from 'react';
import { SkeletonDocument } from '@/components/Loading';
import InfiniteScroll from '@/components/InfiniteScroll';
import { useRouter } from 'next/navigation';
import PageSEO from '@/components/PageSEO';

interface DocumentData {
  id: string;
  title: string;
  category: string;
  fileType: string;
  downloads: number;
  description: string | null;
  fileUrl: string;
}

const categories = ['Все', 'Договоры', 'Акты', 'Спецификации', 'Счета', 'ТЗ'];

export default function DocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchDocs = useCallback(async (pageNum: number, append = false, signal?: AbortSignal) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'Все') params.set('category', selectedCategory);
      if (search) params.set('search', search);
      params.set('sort', sortBy);
      params.set('page', String(pageNum));
      params.set('limit', '20');
      const res = await fetch(`/api/documents?${params}`, { signal });
      const data = await res.json();
      const newDocs = data.documents || [];
      if (append) {
        setDocs(prev => [...prev, ...newDocs]);
      } else {
        setDocs(newDocs);
      }
      setHasMore(pageNum < (data.pagination?.totalPages || 1));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!append) setDocs([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, search, sortBy]);

  useEffect(() => {
    const controller = new AbortController();
    setPage(1);
    setHasMore(true);
    fetchDocs(1, false, controller.signal);
    return () => controller.abort();
  }, [fetchDocs]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDocs(nextPage, true);
  }, [page, fetchDocs]);

  const handleDownload = async (doc: DocumentData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setDownloadingId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.document?.fileUrl) {
        setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, downloads: d.downloads + 1 } : d));
        const link = document.createElement('a');
        link.href = data.document.fileUrl;
        link.download = doc.title || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error('Document download error:', e);
    } finally {
      setDownloadingId(null);
    }
  };

  const fileTypeConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    docx: {
      color: 'bg-blue-50 text-blue-500',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
    },
    xlsx: {
      color: 'bg-emerald-50 text-emerald-500',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h18M3 15h18"/></svg>,
    },
    pdf: {
      color: 'bg-red-50 text-red-500',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>,
    },
  };

  if (loading) return <SkeletonDocument count={5} />;

  return (
    <div className="min-h-screen">
      <PageSEO title="Документы" description="Библиотека мебельных документов на МебПортал: договоры, акты, спецификации, счета и технические задания." />
      <div className="section-container py-10 md:py-14">
        <div className="page-header">
          <h1 className="page-title">Документы</h1>
          <p className="page-subtitle">Шаблоны договоров, актов, спецификаций для мебельщиков</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-5 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Поиск документов..." value={search} onChange={e => setSearch(e.target.value)} className="input-premium pl-11" />
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-premium !w-auto !py-2.5">
              <option value="newest">Сначала новые</option>
              <option value="popular">По популярности</option>
              <option value="title">По названию</option>
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

        {docs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Документов не найдено</h3>
            <p className="text-gray-500 dark:text-gray-400">Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map(doc => {
              const ft = fileTypeConfig[doc.fileType] || { color: 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> };
              return (
                <div key={doc.id} className="card-base p-5 hover-lift group">
                  <div className="flex items-center gap-3 sm:gap-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${ft.color}`}>
                      {ft.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <a href={`/documents/${doc.id}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:text-brand-600 transition-colors block truncate">
                        {doc.title}
                      </a>
                      <div className="flex items-center gap-2.5 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <span className="badge-neutral text-[10px]">{doc.category}</span>
                        <span className="uppercase text-xs font-medium text-gray-400 dark:text-gray-500">{doc.fileType}</span>
                        <span className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                          {doc.downloads}
                        </span>
                      </div>
                      {doc.description && <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5 truncate">{doc.description}</p>}
                    </div>
                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                      className="btn-primary !px-5 !py-2.5 text-sm shrink-0"
                    >
                      {downloadingId === doc.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                          Скачать
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <InfiniteScroll hasMore={hasMore} loading={loadingMore} onLoadMore={loadMore} />
      </div>
    </div>
  );
}
