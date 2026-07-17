'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Loading from '@/components/Loading';
import Lightbox from '@/components/Lightbox';

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  images: string;
  category: string | null;
  tags: string;
  createdAt: string;
  user: { id: string; name: string | null };
}

const categoryLabels: Record<string, string> = {
  kitchen: 'Кухня', bedroom: 'Спальня', living: 'Гостиная', office: 'Офис',
  bathroom: 'Ванная', wardrobe: 'Гардеробная', other: 'Другое',
};

export default function PortfolioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<PortfolioItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/portfolio/user/${params.userId}`, { signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        const found = (d.items || []).find((i: PortfolioItem) => i.id === params.itemId);
        if (found) setItem(found);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [params.userId, params.itemId]);

  if (loading) return <Loading text="Загрузка..." />;
  if (!item) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Работа не найдена</h2>
        <Link href={`/portfolio/${params.userId}`} className="text-brand-500 hover:text-brand-700">Вернуться к портфолио</Link>
      </div>
    </div>
  );

  const images: string[] = (() => { try { return JSON.parse(item.images); } catch { return []; } })();
  const tags: string[] = (() => { try { return JSON.parse(item.tags); } catch { return []; } })();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="section-container py-8 max-w-3xl">
        <button onClick={() => router.back()} className="btn-ghost mb-6 -ml-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад
        </button>

        <article className="card-base overflow-hidden">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Link href={`/portfolio/${params.userId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                  {item.user?.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.user?.name || 'Пользователь'}</p>
                  <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </Link>
              {item.category && (
                <span className="ml-auto px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-xs font-medium">
                  {categoryLabels[item.category] || item.category}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div className="space-y-1">
              {images.map((img, idx) => (
                <div key={idx} className="relative cursor-pointer group" onClick={() => setLightbox({ images, index: idx })}>
                  <Image src={img} alt={`${item.title} — фото ${idx + 1}`} width={800} height={500} className="w-full object-cover" unoptimized />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-sm font-medium text-gray-700 shadow-lg">
                      Увеличить
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div className="p-5 sm:p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed">{item.description}</div>
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="px-5 sm:px-6 pb-5 sm:pb-6">
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>

      {lightbox && (
        <Lightbox images={lightbox.images} initialIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
