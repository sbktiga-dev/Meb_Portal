'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import Lightbox from '@/components/Lightbox';

interface PortfolioData {
  id: string;
  title: string;
  description: string | null;
  images: string;
  category: string | null;
  tags: string;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  kitchen: 'Кухня',
  bedroom: 'Спальня',
  living: 'Гостиная',
  office: 'Офис',
  bathroom: 'Ванная',
  wardrobe: 'Гардеробная',
  other: 'Другое',
};

export default function PortfolioPage() {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/portfolio?page=1&limit=50', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить работу из портфолио?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/portfolio/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setItems(prev => prev.filter(i => i.id !== id));
    } catch {}
    finally { setDeleting(null); }
  };

  return (
    <div className="min-h-screen">
      <div className="section-container py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Моё портфолио</h1>
            <p className="text-gray-500 mt-1">Ваши работы и проекты</p>
          </div>
          <Link href="/dashboard/portfolio/new" className="btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Добавить работу
          </Link>
        </div>

        {loading ? (
          <Loading text="Загрузка портфолио..." />
        ) : items.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Портфолио пусто</h3>
            <p className="text-gray-500 mb-6">Добавьте первую работу, чтобы показать её другим</p>
            <Link href="/dashboard/portfolio/new" className="btn-primary">Добавить работу</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, i) => {
              const tags: string[] = (() => { try { return JSON.parse(item.tags); } catch { return []; } })();
              const images: string[] = (() => { try { return JSON.parse(item.images); } catch { return []; } })();
              return (
                <div key={item.id} className={`card-base overflow-hidden animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                  <div className="h-48 relative group cursor-pointer" onClick={() => images.length > 0 && setLightbox({ images, index: 0 })}>
                    {images.length > 0 ? (
                      <img src={images[0]} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 flex items-center justify-center">
                        <svg className="w-12 h-12 text-brand-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      </div>
                    )}
                    {images.length > 1 && (
                      <span className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">+{images.length - 1}</span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Link href={`/dashboard/portfolio/${item.id}/edit`}
                        className="bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-white transition-colors shadow-lg">
                        Редактировать
                      </Link>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-900 line-clamp-1">{item.title}</h3>
                      {item.category && <span className="badge-brand text-[10px] shrink-0">{categoryLabels[item.category] || item.category}</span>}
                    </div>
                    {item.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tags.slice(0, 3).map(tag => <span key={tag} className="text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">#{tag}</span>)}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString('ru-RU')}</span>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/portfolio/${item.id}/edit`}
                          className="text-xs text-brand-500 hover:text-brand-700 transition-colors font-medium">
                          Изменить
                        </Link>
                        <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40">
                          {deleting === item.id ? 'Удаление...' : 'Удалить'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {lightbox && (
        <Lightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
