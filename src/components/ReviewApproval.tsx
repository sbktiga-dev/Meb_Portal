'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import StarRating from './StarRating';
import DisputeForm from './DisputeForm';
import { getDisplayName, getDisplayInitial } from '@/lib/displayName';
import toast from 'react-hot-toast';

interface PendingReview {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  expiresAt: string | null;
  reviewer: { id: string; name: string | null; avatar: string | null; role: string };
}

interface ReviewApprovalProps {
  userId: string;
}

export default function ReviewApproval({ userId }: ReviewApprovalProps) {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [disputingId, setDisputingId] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`/api/users/${userId}/reviews/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [userId]);

  const handleApprove = async (reviewId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${userId}/reviews/${reviewId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Отзыв одобрен');
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Ошибка');
      }
    } catch {
      toast.error('Ошибка сети');
    }
  };

  const handleDisputeSuccess = (reviewId: string) => {
    setDisputingId(null);
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    toast.success('Спор отправлен на рассмотрение');
  };

  if (loading) return null;
  if (reviews.length === 0) return null;

  return (
    <div className="card-base p-4 md:p-5 mb-4">
      <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Отзывы на одобрение ({reviews.length})
      </h3>
      <div className="space-y-3">
        {reviews.map(review => {
          const expiresIn = review.expiresAt
            ? Math.max(0, Math.floor((new Date(review.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)))
            : null;

          if (disputingId === review.id) {
            return (
              <DisputeForm
                key={review.id}
                userId={userId}
                reviewId={review.id}
                onCancel={() => setDisputingId(null)}
                onSuccess={() => handleDisputeSuccess(review.id)}
              />
            );
          }

          return (
            <div key={review.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Link href={`/profile/${review.reviewer.id}`} className="shrink-0">
                  {review.reviewer.avatar ? (
                    <div className="w-9 h-9 rounded-full overflow-hidden relative">
                      <Image src={review.reviewer.avatar} alt="" fill className="object-cover" sizes="36px" unoptimized />
                    </div>
                  ) : (
                    <div className="w-9 h-9 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {getDisplayInitial(review.reviewer.name, review.reviewer.role)}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${review.reviewer.id}`} className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:text-brand-600">
                      {getDisplayName(review.reviewer.name, review.reviewer.role)}
                    </Link>
                    <StarRating rating={review.score} readonly size="sm" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.comment}</p>
                  )}
                  {expiresIn !== null && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      Автопубликация через {expiresIn}ч
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleApprove(review.id)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                >
                  Одобрить
                </button>
                <button
                  onClick={() => setDisputingId(review.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                >
                  Оспорить
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
