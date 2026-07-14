'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import StarRating from '@/components/StarRating';
import { getDisplayName, getDisplayInitial } from '@/lib/displayName';
import toast from 'react-hot-toast';

interface DisputedReview {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  disputeText: string | null;
  disputeImages: string;
  disputedAt: string | null;
  reviewer: { id: string; name: string | null; avatar: string | null; role: string };
  target: { id: string; name: string | null; avatar: string | null; role: string };
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<DisputedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('disputed');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.user?.role !== 'ADMIN') router.push('/dashboard'); })
      .catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/admin/reviews?status=${filter}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch {
        toast.error('Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [filter]);

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/reviews/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Отзыв одобрен');
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error('Ошибка');
      }
    } catch {
      toast.error('Ошибка сети');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/reviews/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Отзыв отклонён');
        setReviews(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error('Ошибка');
      }
    } catch {
      toast.error('Ошибка сети');
    }
  };

  const statusTabs = [
    { key: 'disputed', label: 'Спорные', count: reviews.length },
    { key: 'pending', label: 'Ожидающие', count: null },
    { key: 'approved', label: 'Одобренные', count: null },
    { key: 'rejected', label: 'Отклонённые', count: null },
  ];

  return (
    <div className="min-h-screen py-10">
      <div className="section-container max-w-5xl">
        <Link href="/admin" className="text-sm text-gray-400 dark:text-gray-500 hover:text-brand-500 transition-colors mb-4 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Модерация отзывов</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {statusTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                filter === tab.key
                  ? 'bg-brand-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Загрузка...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Нет отзывов</div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => {
              const disputeImages: string[] = (() => { try { return JSON.parse(review.disputeImages); } catch { return []; } })();

              return (
                <div key={review.id} className="card-base p-5">
                  {/* Review info */}
                  <div className="flex items-start gap-3 mb-4">
                    <Link href={`/profile/${review.reviewer.id}`} className="shrink-0">
                      {review.reviewer.avatar ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden relative">
                          <Image src={review.reviewer.avatar} alt={review.reviewer.name || "Автор отзыва"} fill className="object-cover" sizes="40px" unoptimized />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {getDisplayInitial(review.reviewer.name, review.reviewer.role)}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${review.reviewer.id}`} className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:text-brand-600">
                          {getDisplayName(review.reviewer.name, review.reviewer.role)}
                        </Link>
                        <span className="text-gray-400">→</span>
                        <Link href={`/profile/${review.target.id}`} className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:text-brand-600">
                          {getDisplayName(review.target.name, review.target.role)}
                        </Link>
                        <StarRating rating={review.score} readonly size="sm" />
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.comment}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString('ru-RU')}</p>
                    </div>
                  </div>

                  {/* Dispute info */}
                  {review.disputeText && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
                      <h4 className="font-bold text-red-700 dark:text-red-400 text-sm mb-2">Причина спора:</h4>
                      <p className="text-sm text-red-600 dark:text-red-300">{review.disputeText}</p>
                      {disputeImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {disputeImages.map((img, idx) => (
                            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden">
                              <Image src={img} alt="Фото спора" fill className="object-cover" sizes="80px" unoptimized />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                    >
                      Одобрить отзыв
                    </button>
                    <button
                      onClick={() => handleReject(review.id)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
                    >
                      Отклонить отзыв
                    </button>
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
