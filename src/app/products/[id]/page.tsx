'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SkeletonPage } from '@/components/Loading';
import Image from 'next/image';
import StarRating from '@/components/StarRating';
import PageSEO from '@/components/PageSEO';

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  images: string;
  category: string;
  brand: string | null;
  specs: string;
  createdAt: string;
  company: { id: string; name: string; logo: string | null; phone: string | null; email: string | null } | null;
  supplier: { id: string; companyName: string; logo: string | null; phone: string | null; email: string | null } | null;
  reviews: { id: string; score: number; comment: string | null; createdAt: string; user: { id: string; name: string | null; avatar: string | null } }[];
  _count: { reviews: number };
  avgRating: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProduct = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/products/${params.id}`, { signal });
      if (!res.ok) { router.push('/products'); return; }
      const data = await res.json();
      setProduct(data.product);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      router.push('/products');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProduct(controller.signal);
    return () => controller.abort();
  }, [fetchProduct]);

  const handleReview = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${params.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score: reviewScore, comment: reviewComment }),
      });
      if (res.ok) {
        const data = await res.json();
        setProduct(prev => prev ? {
          ...prev,
          reviews: [data.review, ...prev.reviews],
          _count: { ...prev._count, reviews: prev._count.reviews + 1 },
        } : prev);
        setReviewComment('');
        setReviewScore(5);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <SkeletonPage />;
  if (!product) return null;

  const productImages: string[] = (() => { try { return JSON.parse(product.images); } catch { return []; } })();
  const specs: { key: string; value: string }[] = (() => { try { return JSON.parse(product.specs); } catch { return []; } })();
  const formatPrice = (price: number | null) => {
    if (!price) return 'Цена не указана';
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <PageSEO title={product.name || 'Товар'} description={product.description?.slice(0, 160) || `Товар на МебПортал: ${product.name}`} />
      <div className="section-container py-10">
        <Link href="/products" className="text-sm text-gray-400 dark:text-gray-500 hover:text-brand-500 transition-colors mb-6 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Все товары
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 mb-12 animate-fade-in">
          <div>
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-card overflow-hidden aspect-square">
              {productImages.length > 0 ? (
                <Image src={productImages[selectedImage]} alt={product.name} width={600} height={600} className="w-full h-full object-contain p-4" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-24 h-24 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                </div>
              )}
            </div>
            {productImages.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {productImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 border-transparent hover:border-gray-200 transition-colors"
                    style={{ borderColor: selectedImage === i ? 'var(--color-brand-500, #6366f1)' : 'transparent' }}
                  >
                    <div className="relative w-full h-full">
                      <Image src={img} alt="Изображение товара" fill className="object-cover" sizes="64px" unoptimized />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-neutral">{product.category}</span>
                {product.brand && <span className="badge-brand">{product.brand}</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{product.name}</h1>
              {product.avgRating > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={product.avgRating} readonly />
                  <span className="text-sm text-gray-500 dark:text-gray-400">{product.avgRating.toFixed(1)} ({product._count.reviews} отзывов)</span>
                </div>
              )}
            </div>

            <div className="text-3xl font-bold text-brand-600">{formatPrice(product.price)}</div>

            {product.description && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Описание</h2>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {specs.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Характеристики</h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {specs.map((spec, i) => (
                    <div key={i} className="flex justify-between px-4 py-3 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{spec.key}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(product.company || product.supplier) && (
              <div className="card-base p-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Поставщик</h2>
                {product.company && (
                  <Link href={`/companies/${product.company.id}`} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl p-2 -m-2 transition-colors">
                    {product.company.logo ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden">
                        <Image src={product.company.logo} alt="Логотип" fill className="object-cover" sizes="48px" unoptimized />
                      </div>
                    ) : (
                      <div className="w-12 h-12 gradient-brand rounded-xl flex items-center justify-center text-white font-bold">{product.company.name.charAt(0)}</div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{product.company.name}</p>
                      {product.company.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{product.company.phone}</p>}
                    </div>
                  </Link>
                )}
                {product.supplier && (
                  <Link href={`/suppliers/${product.supplier.id}`} className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl p-2 -m-2 transition-colors mt-2">
                    {product.supplier.logo ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden">
                        <Image src={product.supplier.logo} alt="Логотип" fill className="object-cover" sizes="48px" unoptimized />
                      </div>
                    ) : (
                      <div className="w-12 h-12 gradient-brand rounded-xl flex items-center justify-center text-white font-bold">{product.supplier.companyName.charAt(0)}</div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{product.supplier.companyName}</p>
                      {product.supplier.phone && <p className="text-sm text-gray-500 dark:text-gray-400">{product.supplier.phone}</p>}
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto animate-fade-in-up stagger-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Отзывы ({product._count.reviews})</h2>

          <div className="card-base p-5 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Оставить отзыв</h3>
            <div className="mb-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Ваша оценка</p>
              <StarRating rating={reviewScore} onChange={setReviewScore} />
            </div>
            <textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              className="input-premium min-h-[80px] mb-3"
              placeholder="Расскажите о товаре..."
            />
            <button onClick={handleReview} disabled={submitting} className="btn-primary">
              {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Отправить отзыв'}
            </button>
          </div>

          <div className="space-y-4">
            {product.reviews.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-gray-500 py-8">Пока нет отзывов</p>
            ) : (
              product.reviews.map((review, i) => (
                <div key={review.id} className={`card-base p-5 animate-fade-in-up stagger-${Math.min((i % 5) + 1, 6)}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {review.user.avatar ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden">
                        <Image src={review.user.avatar} alt={review.user.name || 'Аватар'} fill className="object-cover" sizes="40px" unoptimized />
                      </div>
                    ) : (
                      <div className="w-10 h-10 gradient-brand rounded-full flex items-center justify-center text-white text-sm font-bold">{review.user.name?.charAt(0) || '?'}</div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{review.user.name || 'Аноним'}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(review.createdAt).toLocaleDateString('ru-RU')}</p>
                    </div>
                    <div className="ml-auto">
                      <StarRating rating={review.score} readonly size="sm" />
                    </div>
                  </div>
                  {review.comment && <p className="text-gray-600 dark:text-gray-400">{review.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
