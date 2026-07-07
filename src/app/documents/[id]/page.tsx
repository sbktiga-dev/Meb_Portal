'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SkeletonPage } from '@/components/Loading';
import FavoriteButton from '@/components/FavoriteButton';
import PageSEO from '@/components/PageSEO';
import { downloadPdf } from '@/lib/pdf';

interface DocumentData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileType: string;
  downloads: number;
  fileUrl: string;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchDoc = async () => {
      try { const res = await fetch(`/api/documents/${params.id}`, { signal: controller.signal }); const data = await res.json(); setDoc(data.document); }
      catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setDoc(null);
      } finally { setLoading(false); }
    };
    fetchDoc();
    return () => controller.abort();
  }, [params.id]);

  const handleDownload = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    setDownloading(true);
    try {
      const res = await fetch(`/api/documents/${params.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setDoc(prev => prev ? { ...prev, downloads: prev.downloads + 1 } : prev);
        if (data.document.fileUrl) {
          const link = document.createElement('a');
          link.href = data.document.fileUrl;
          link.download = data.document.title || 'document';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch {} finally { setDownloading(false); }
  };

  if (loading) return <SkeletonPage />;
  if (!doc) return <div className="text-center py-20 text-gray-500">Документ не найден</div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <PageSEO title={doc.title || 'Документ'} description={doc.description?.slice(0, 160) || `Документ на МебПортал: ${doc.title}`} />
      <div className="section-container py-10 max-w-4xl">
        <button onClick={() => router.back()} className="btn-ghost mb-6 -ml-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад к документам
        </button>

        <div className="card-base overflow-hidden">
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{doc.title}</h1>
              <span className="badge-neutral uppercase text-xs">{doc.fileType}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="badge-brand">{doc.category}</span>
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                {doc.downloads} загрузок
              </span>
            </div>
            {doc.description && <p className="text-gray-600 leading-relaxed">{doc.description}</p>}
          </div>
          <div className="p-6 bg-gray-50/50 flex gap-3">
            <button onClick={handleDownload} disabled={downloading} className="btn-primary">
              {downloading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Скачать файл</>}
            </button>
            <button onClick={() => downloadPdf(doc.title, [{ heading: doc.category, content: doc.description || doc.title }])} className="btn-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              Скачать PDF
            </button>
            <FavoriteButton itemType="document" itemId={doc.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
