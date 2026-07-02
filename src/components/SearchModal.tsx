'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SearchResults {
  images: { id: string; title: string; style: string | null; category: string | null; downloads: number }[];
  documents: { id: string; title: string; category: string; fileType: string; downloads: number }[];
  posts: { id: string; title: string; category: string; createdAt: string; author: { id: string; name: string | null; avatar: string | null } }[];
  users: { id: string; name: string | null; email: string; avatar: string | null; role: string }[];
}

const categoryLabels: Record<string, string> = {
  news: 'Новость', project: 'Проект', article: 'Статья', product: 'Товар',
};

export default function SearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleOpenSearch = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-search', handleOpenSearch);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-search', handleOpenSearch);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  const search = useCallback(async (q: string, signal?: AbortSignal) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal });
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setResults(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => search(query, controller.signal), 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, search]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const totalResults = results
    ? results.images.length + results.documents.length + results.posts.length + results.users.length
    : 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-700 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <span className="hidden sm:inline">Поиск...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-white border border-gray-200 rounded">
          <span className="text-xs">Ctrl</span>+<span className="text-xs">K</span>
        </kbd>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-down">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Поиск по изображениям, документам, постам, людям..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 text-sm outline-none placeholder:text-gray-400"
              />
              <kbd className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">ESC</kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
                </div>
              ) : results ? (
                totalResults === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-400 text-sm">Ничего не найдено по запросу «{query}»</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {results.users.length > 0 && (
                      <SearchGroup title="Люди">
                        {results.users.map(user => (
                          <button key={user.id} onClick={() => handleSelect(`/portfolio/${user.id}`)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                            <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {user.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'Пользователь'}</p>
                              <p className="text-xs text-gray-400">{user.role}</p>
                            </div>
                          </button>
                        ))}
                      </SearchGroup>
                    )}

                    {results.posts.length > 0 && (
                      <SearchGroup title="Посты">
                        {results.posts.map(post => (
                          <button key={post.id} onClick={() => handleSelect(`/feed/${post.id}`)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500 flex-shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span>{categoryLabels[post.category] || post.category}</span>
                                {post.author && <span>· {post.author.name || 'Аноним'}</span>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </SearchGroup>
                    )}

                    {results.images.length > 0 && (
                      <SearchGroup title="Изображения">
                        {results.images.map(img => (
                          <button key={img.id} onClick={() => handleSelect(`/gallery/${img.id}`)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center text-brand-500 flex-shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{img.title}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                {img.style && <span>{img.style}</span>}
                                <span>· {img.downloads} загрузок</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </SearchGroup>
                    )}

                    {results.documents.length > 0 && (
                      <SearchGroup title="Документы">
                        {results.documents.map(doc => (
                          <button key={doc.id} onClick={() => handleSelect(`/documents/${doc.id}`)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500 flex-shrink-0">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span>{doc.category}</span>
                                <span>· {doc.fileType.toUpperCase()}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </SearchGroup>
                    )}
                  </div>
                )
              ) : query.length >= 2 ? null : (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-400">Начните вводить для поиска</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {['Кухни', 'Документы', 'Поставщики', 'Специалисты'].map(tag => (
                      <button key={tag} onClick={() => setQuery(tag)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SearchGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</div>
      {children}
    </div>
  );
}
