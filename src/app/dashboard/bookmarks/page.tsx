'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface BookmarkData {
  id: string;
  name: string;
  createdAt: string;
  items: { id: string; itemType: string; itemId: string }[];
  _count: { items: number };
}

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchBookmarks = useCallback(async (signal?: AbortSignal) => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const res = await fetch('/api/bookmarks', { headers: { Authorization: `Bearer ${token}` }, signal });
      if (signal?.aborted) return;
      const data = await res.json();
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Fetch bookmarks error:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    fetchBookmarks(controller.signal);
    return () => controller.abort();
  }, [fetchBookmarks]);

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token || !newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        const data = await res.json();
        setBookmarks(prev => [data.bookmark, ...prev]);
        setNewName('');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить коллекцию?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`/api/bookmarks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      setBookmarks(prev => prev.filter(b => b.id !== id));
    }
  };

  return (
    <div className="min-h-screen">
      <div className="section-container py-10">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Мои закладки</h1>
            <p className="text-gray-500 mt-1">Коллекции сохранённых материалов</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5 mb-8 animate-fade-in-up stagger-1">
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="input-premium flex-1"
              placeholder="Название новой коллекции..."
            />
            <button onClick={handleCreate} disabled={creating || !newName.trim()} className="btn-primary">
              {creating ? '...' : 'Создать'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-base p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Пока нет закладок</h3>
            <p className="text-gray-500">Создайте первую коллекцию выше</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark, i) => (
              <div key={bookmark.id} className={`card-base p-5 hover-lift animate-fade-in-up stagger-${Math.min((i % 6) + 1, 6)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                  </div>
                  <button
                    onClick={() => handleDelete(bookmark.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{bookmark.name}</h3>
                <p className="text-sm text-gray-400">{bookmark._count.items} элементов</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
