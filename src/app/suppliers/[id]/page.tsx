'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SkeletonPage } from '@/components/Loading';

interface SupplierData {
  id: string;
  companyName: string;
  description: string | null;
  logo: string | null;
  categories: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  isVerified: boolean;
  userId: string | null;
  products: { name: string; price: number | null; description: string | null }[];
}

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
        .then(r => r.json())
        .then(d => { if (d.user) setCurrentUserId(d.user.id); })
        .catch(() => {});
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSupplier = async () => {
      try { const res = await fetch(`/api/suppliers/${params.id}`, { signal: controller.signal }); const data = await res.json(); setSupplier(data.supplier); }
      catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSupplier(null);
      } finally { setLoading(false); }
    };
    fetchSupplier();
    return () => controller.abort();
  }, [params.id]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supplier) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        const updateRes = await fetch(`/api/suppliers/${supplier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ logo: data.url }),
        });
        if (updateRes.ok) {
          setSupplier(prev => prev ? { ...prev, logo: data.url } : prev);
        }
      }
    } catch {}
    finally { setUploading(false); }
  };

  const isOwner = currentUserId && supplier?.userId === currentUserId;

  if (loading) return <SkeletonPage />;
  if (!supplier) return <div className="text-center py-20 text-gray-500">Поставщик не найден</div>;

  const cats: string[] = (() => { try { return JSON.parse(supplier.categories); } catch { return []; } })();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="section-container py-10 max-w-4xl">
        <button onClick={() => router.back()} className="btn-ghost mb-6 -ml-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад к поставщикам
        </button>

        <div className="card-base overflow-hidden">
          <div className="p-5 sm:p-8 border-b border-gray-100">
            <div className="flex items-start gap-4 mb-4">
              {isOwner ? (
                <button onClick={() => fileInputRef.current?.click()} className="relative group flex-shrink-0" disabled={uploading}>
                  {supplier.logo ? (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50 relative">
                      <Image src={supplier.logo} alt={supplier.companyName} fill className="object-contain" sizes="64px" unoptimized />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-50 to-orange-50 rounded-2xl flex items-center justify-center text-brand-500 font-bold text-2xl">
                      {supplier.companyName.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                        <circle cx="12" cy="13" r="3"/>
                      </svg>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </button>
              ) : supplier.logo ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 bg-gray-50 relative">
                  <Image src={supplier.logo} alt={supplier.companyName} fill className="object-contain" sizes="64px" unoptimized />
                </div>
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-brand-50 to-orange-50 rounded-2xl flex items-center justify-center text-brand-500 font-bold text-2xl flex-shrink-0">
                  {supplier.companyName.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">{supplier.companyName}</h1>
                  {supplier.isVerified && <span className="badge-success shrink-0">Проверено</span>}
                </div>
                {isOwner && <p className="text-xs text-gray-400 mt-1">Нажмите на логотип, чтобы загрузить</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {cats.map(cat => <span key={cat} className="badge-brand">{cat}</span>)}
                </div>
              </div>
            </div>
            {supplier.description && <p className="text-gray-600 leading-relaxed">{supplier.description}</p>}

            {supplier.userId && (
              <div className="flex flex-wrap gap-3 mt-4">
                <Link href={`/portfolio/${supplier.userId}`} className="btn-primary !px-5 !py-2.5 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  Портфолио
                </Link>
                <Link href={`/feed?authorId=${supplier.userId}`} className="btn-secondary !px-5 !py-2.5 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
                  Посты
                </Link>
              </div>
            )}
          </div>

          {supplier.products.length > 0 && (
            <div className="p-5 sm:p-8 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Каталог товаров</h2>
              <div className="space-y-3">
                {supplier.products.map((product, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-colors">
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      {product.description && <p className="text-sm text-gray-500 mt-0.5">{product.description}</p>}
                    </div>
                    {product.price && <span className="text-brand-600 font-bold whitespace-nowrap">от {product.price} ₽</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-5 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Контакты</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {supplier.phone && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg></div>
                  <div><p className="text-xs text-gray-400">Телефон</p><p className="font-medium text-gray-900">{supplier.phone}</p></div>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                  <div><p className="text-xs text-gray-400">Email</p><p className="font-medium text-gray-900">{supplier.email}</p></div>
                </div>
              )}
              {supplier.website && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl md:col-span-2">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></div>
                  <div><p className="text-xs text-gray-400">Сайт</p><a href={supplier.website} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 hover:text-brand-700">{supplier.website}</a></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
