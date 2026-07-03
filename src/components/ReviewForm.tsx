'use client';

import { useState } from 'react';
import StarRating from './StarRating';
import toast from 'react-hot-toast';

interface ReviewFormProps {
  targetUserId: string;
  onSuccess: () => void;
}

export default function ReviewForm({ targetUserId, onSuccess }: ReviewFormProps) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) {
      toast.error('Выберите оценку');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${targetUserId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ score, comment: comment.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Ошибка');
        return;
      }
      toast.success('Отзыв отправлен');
      setScore(0);
      setComment('');
      onSuccess();
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card-base p-5 space-y-4">
      <h3 className="font-bold text-gray-900 text-sm">Оставить отзыв</h3>
      <div>
        <p className="text-xs text-gray-500 mb-2">Ваша оценка</p>
        <StarRating rating={score} onChange={setScore} size="lg" />
      </div>
      <div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Расскажите о вашем опыте (необязательно)"
          maxLength={1000}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/1000</p>
      </div>
      <button
        onClick={handleSubmit}
        disabled={submitting || score === 0}
        className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Отправка...' : 'Отправить отзыв'}
      </button>
    </div>
  );
}
