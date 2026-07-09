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
    reviewer: { id: string; name: string | null; avatar: string | null; role: string };
  };
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const { reviewer } = review;
  const date = new Date(review.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="card-base p-5">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${reviewer.id}`} className="shrink-0">
          {reviewer.avatar ? (
            <div className="w-10 h-10 rounded-full overflow-hidden relative">
              <Image src={reviewer.avatar} alt="" fill className="object-cover" sizes="40px" unoptimized />
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
