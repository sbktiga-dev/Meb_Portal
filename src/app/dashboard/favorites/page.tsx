'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/components/Loading';
import Image from 'next/image';

interface FavoriteItem {
  id: string;
  itemType: string;
  itemId: string;
  createdAt: string;
  item: {
    id: string;
    title: string;
    category?: string;
    fileType?: string;
    downloads?: number;
    url?: string;
  } | null;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const typeParam = filter !== 'all' ? `&type=${filter}` : '';
        const res = await fetch(`/api/favorites?limit=50${typeParam}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await res.json();
        setFavorites(data.favorites || []);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setFavorites([]);
      }
      setLoading(false);
    };
    fetchFavorites();
    return () => controller.abort();
  }, [router, filter]);

  const handleRemove = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setRemoving(id);
    try {
      const fav = favorites.find(f => f.id === id);
      if (!fav) return;
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: fav.itemType, itemId: fav.itemId }),
      });
      const data = await res.json();
      if (res.ok && !data.favorited) {
        setFavorites(prev => prev.filter(f => f.id !== id));
      }
    } catch (err) {
      console.error('Remove favorite error:', err);
    }
    setRemoving(null);
  };

  const getHref = (fav: FavoriteItem) => {
    if (fav.itemType === 'image') return `/gallery/${fav.itemId}`;
    if (fav.itemType === 'document') return `/documents/${fav.itemId}`;
    return '#';
  };

  return (
    <div className="min-h-screen">
      <div className="section-container py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Избранное</h1>
            <p className="text-gray-500 mt-1">Сохранённые изображения и документы</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 animate-fade-in-up stagger-1">
          {[
            { key: 'all', label: 'Все' },
            { key: 'image', label: 'Изображения' },
            { key: 'document', label: 'Документы' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.key ? 'bg-brand-500 text-white shadow-card' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Loading text="Загрузка избранного..." />
        ) : favorites.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Избранное пусто</h3>
            <p className="text-gray-500 mb-6">Сохраняйте понравившиеся изображения и документы</p>
            <Link href="/gallery" className="btn-primary">Перейти в каталог</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav, i) => {
              if (!fav.item) return null;
              return (
                <div key={fav.id} className={`card-base overflow-hidden animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                  <div className="h-48 relative group">
                    {fav.itemType === 'image' && fav.item.url ? (
                      <Image src={fav.item.url} alt={fav.item.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" unoptimized />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 flex items-center justify-center">
                        <svg className="w-12 h-12 text-brand-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
                          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                      <Link href={getHref(fav)}
                        className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white transition-colors shadow-lg">
                        Открыть
                      </Link>
                      <button onClick={() => handleRemove(fav.id)} disabled={removing === fav.id}
                        className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-500 transition-colors shadow-lg disabled:opacity-50">
                        {removing === fav.id ? '...' : 'Убрать'}
                      </button>
                    </div>
                    <span className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
                      {fav.itemType === 'image' ? 'Изображение' : 'Документ'}
                    </span>
                  </div>
                  <div className="p-5">
                    <Link href={getHref(fav)}>
                      <h3 className="font-bold text-gray-900 line-clamp-1 hover:text-brand-600 transition-colors">{fav.item.title}</h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                      {fav.item.category && <span className="badge-brand text-[10px]">{fav.item.category}</span>}
                      {fav.item.fileType && <span className="uppercase text-xs font-medium">{fav.item.fileType}</span>}
                      {fav.item.downloads !== undefined && <span>· {fav.item.downloads} загрузок</span>}
                    </div>
                    <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Сохранено {new Date(fav.createdAt).toLocaleDateString('ru-RU')}</span>
                      <button onClick={() => handleRemove(fav.id)} disabled={removing === fav.id}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40">
                        {removing === fav.id ? 'Удаление...' : 'Убрать'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
