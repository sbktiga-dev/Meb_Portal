'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import StarRating from '@/components/StarRating';

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  images: string;
  category: string;
  brand: string | null;
  specs: string;
  company: { id: string; name: string } | null;
  supplier: { id: string; companyName: string } | null;
  _count: { reviews: number };
  avgRating: number;
}

function CompareContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    if (ids.length === 0) { setLoading(false); return; }

    fetch(`/api/products/batch?ids=${ids.join(',')}`)
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchParams]);

  const formatPrice = (price: number | null) => {
    if (!price) return '—';
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(price);
  };

  const allSpecs = Array.from(new Set(products.flatMap(p => {
    try { return JSON.parse(p.specs).map((s: { key: string }) => s.key); } catch { return []; }
  })));

  return (
    <>
      <Link href="/products" className="text-sm text-gray-400 hover:text-brand-500 transition-colors mb-6 inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
        Все товары
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Сравнение товаров</h1>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Загрузка...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">Выберите товары для сравнения</p>
          <Link href="/products" className="btn-primary">Перейти к каталогу</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left p-4 bg-white rounded-tl-xl border border-gray-100 w-40">Параметр</th>
                {products.map(p => (
                  <th key={p.id} className="p-4 bg-white border border-gray-100 last:rounded-tr-xl">
                    <Link href={`/products/${p.id}`} className="block hover:text-brand-600 transition-colors">
                      <div className="w-20 h-20 mx-auto mb-3 rounded-xl overflow-hidden bg-gray-50">
                        {(() => { const imgs = JSON.parse(p.images); return imgs.length > 0 ? <div className="relative w-full h-full"><Image src={imgs[0]} alt="" fill className="object-cover" sizes="80px" unoptimized /></div> : <div className="w-full h-full flex items-center justify-center"><svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div>; })()}
                      </div>
                      <p className="font-semibold text-sm line-clamp-2">{p.name}</p>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-4 bg-gray-50 border border-gray-100 text-sm font-medium text-gray-500">Цена</td>
                {products.map(p => (
                  <td key={p.id} className="p-4 bg-white border border-gray-100 text-center text-sm font-bold text-brand-600">{formatPrice(p.price)}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 bg-gray-50 border border-gray-100 text-sm font-medium text-gray-500">Рейтинг</td>
                {products.map(p => (
                  <td key={p.id} className="p-4 bg-white border border-gray-100 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <StarRating rating={p.avgRating} readonly size="sm" />
                      <span className="text-xs text-gray-400">({p._count.reviews})</span>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 bg-gray-50 border border-gray-100 text-sm font-medium text-gray-500">Категория</td>
                {products.map(p => (
                  <td key={p.id} className="p-4 bg-white border border-gray-100 text-center text-sm">{p.category}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 bg-gray-50 border border-gray-100 text-sm font-medium text-gray-500">Бренд</td>
                {products.map(p => (
                  <td key={p.id} className="p-4 bg-white border border-gray-100 text-center text-sm">{p.brand || '—'}</td>
                ))}
              </tr>
              <tr>
                <td className="p-4 bg-gray-50 border border-gray-100 text-sm font-medium text-gray-500">Поставщик</td>
                {products.map(p => (
                  <td key={p.id} className="p-4 bg-white border border-gray-100 text-center text-sm">{p.company?.name || p.supplier?.companyName || '—'}</td>
                ))}
              </tr>
              {allSpecs.map(specKey => (
                <tr key={specKey}>
                  <td className="p-4 bg-gray-50 border border-gray-100 text-sm font-medium text-gray-500">{specKey}</td>
                  {products.map(p => {
                    const specs: { key: string; value: string }[] = (() => { try { return JSON.parse(p.specs); } catch { return []; } })();
                    const spec = specs.find(s => s.key === specKey);
                    return <td key={p.id} className="p-4 bg-white border border-gray-100 text-center text-sm">{spec?.value || '—'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function ComparePage() {
  return (
    <div className="min-h-screen">
      <div className="section-container py-10">
        <Suspense fallback={<div className="text-center py-20 text-gray-400">Загрузка...</div>}>
          <CompareContent />
        </Suspense>
      </div>
    </div>
  );
}
