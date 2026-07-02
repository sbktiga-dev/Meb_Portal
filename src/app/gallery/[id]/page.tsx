'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SkeletonPage } from '@/components/Loading';
import Link from 'next/link';
import FavoriteButton from '@/components/FavoriteButton';

interface ImageData {
  id: string;
  title: string;
  description: string | null;
  style: string | null;
  category: string | null;
  tags: string;
  downloads: number;
  url: string;
  createdAt: string;
}

interface RelatedImage {
  id: string;
  title: string;
  style: string | null;
  downloads: number;
}

export default function ImageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [image, setImage] = useState<ImageData | null>(null);
  const [related, setRelated] = useState<RelatedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchImage = async () => {
      try {
        const res = await fetch(`/api/images/${params.id}`, { signal: controller.signal });
        const data = await res.json();
        setImage(data.image);
        if (data.image?.category) {
          const relRes = await fetch(`/api/images?category=${data.image.category}&limit=4`, { signal: controller.signal });
          const relData = await relRes.json();
          setRelated((relData.images || []).filter((i: RelatedImage) => i.id !== params.id).slice(0, 3));
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setImage(null);
      } finally { setLoading(false); }
    };
    fetchImage();
    return () => controller.abort();
  }, [params.id]);

  const handleDownload = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    setDownloading(true);
    try {
      const res = await fetch('/api/downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageId: image?.id }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setImage(prev => prev ? { ...prev, downloads: prev.downloads + 1 } : prev);
        const link = document.createElement('a');
        link.href = data.url;
        link.download = image?.title || 'image';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {} finally { setDownloading(false); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <SkeletonPage />;
  if (!image) return <div className="text-center py-20 text-gray-500">Изображение не найдено</div>;

  const tags: string[] = (() => { try { return JSON.parse(image.tags); } catch { return []; } })();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="section-container py-10 max-w-5xl">
        <button onClick={() => router.back()} className="btn-ghost mb-6 -ml-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад к каталогу
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card-base overflow-hidden">
              {image.url ? (
                <img src={image.url} alt={image.title} className="w-full h-auto object-contain bg-gray-50" />
              ) : (
                <div className="bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 aspect-[16/10] flex items-center justify-center">
                  <svg className="w-24 h-24 text-brand-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-base p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{image.title}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {image.style && <span className="badge-brand">{image.style}</span>}
                {image.category && <span className="badge-neutral">{image.category}</span>}
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {tags.map(tag => <span key={tag} className="badge bg-blue-50 text-blue-600 text-[10px]">#{tag}</span>)}
                </div>
              )}
              {image.description && <p className="text-gray-600 leading-relaxed mb-5">{image.description}</p>}
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>{image.downloads}</span>
                <span>·</span>
                <span>{new Date(image.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="space-y-3">
                <button onClick={handleDownload} disabled={downloading} className="btn-primary w-full">
                  {downloading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Скачать</>}
                </button>
                <div className="flex gap-3">
                  <FavoriteButton itemType="image" itemId={image.id} />
                  <button onClick={handleShare} className="btn-secondary flex-1">
                    {copied ? <><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Скопировано!</> : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Поделиться</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Похожие изображения</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {related.map(img => (
                <Link key={img.id} href={`/gallery/${img.id}`} className="card-base overflow-hidden hover-lift group">
                  <div className="bg-gradient-to-br from-brand-50 to-orange-50 h-32 flex items-center justify-center">
                    <svg className="w-8 h-8 text-brand-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm truncate group-hover:text-brand-600 transition">{img.title}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">{img.downloads} загрузок</span>
                      {img.style && <span className="badge-brand text-[10px]">{img.style}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
