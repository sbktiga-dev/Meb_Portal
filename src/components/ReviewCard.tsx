'use client';

import Link from 'next/link';
import Image from 'next/image';
import StarRating from './StarRating';
import { getDisplayName, getDisplayInitial } from '@/lib/displayName';

interface ReviewCardProps {
  review: {
    id: string;
    score: number;
    comment: string | null;
    createdAt: string;
    status?: string;
    reviewer: { id: string; name: string | null; avatar: string | null; role: string };
  };
  showStatus?: boolean;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Ожидает одобрения', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: 'Одобрен', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  auto_approved: { label: 'Опубл.', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  disputed: { label: 'На рассмотрении', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  rejected: { label: 'Отклонён', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export default function ReviewCard({ review, showStatus = false }: ReviewCardProps) {
  const { reviewer } = review;
  const date = new Date(review.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const statusInfo = review.status ? statusLabels[review.status] : null;

  return (
    <div className="card-base p-5">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${reviewer.id}`} className="shrink-0">
          {reviewer.avatar ? (
            <div className="w-10 h-10 rounded-full overflow-hidden relative">
              <Image src={reviewer.avatar} alt={reviewer.name || "Автор отзыва"} fill className="object-cover" sizes="40px" unoptimized />
            </div>
          ) : (
            <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {getDisplayInitial(reviewer.name, reviewer.role)}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/${reviewer.id}`} className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              {getDisplayName(reviewer.name, reviewer.role)}
            </Link>
            <StarRating rating={review.score} readonly size="sm" />
            {showStatus && statusInfo && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{date}</p>
          {review.comment && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}
