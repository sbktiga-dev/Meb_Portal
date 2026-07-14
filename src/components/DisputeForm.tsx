'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { checkProfanity, PROFANITY_WARNING } from '@/lib/profanity';

interface DisputeFormProps {
  userId: string;
  reviewId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function DisputeForm({ userId, reviewId, onCancel, onSuccess }: DisputeFormProps) {
  const [disputeText, setDisputeText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Максимальный размер 10 МБ');
      return;
    }
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
        setImages(prev => [...prev, data.url]);
        toast.success('Изображение загружено');
      } else {
        toast.error(data.error || 'Ошибка загрузки');
      }
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!disputeText.trim()) {
      toast.error('Укажите причину оспаривания');
      return;
    }

    // Проверка на нецензурную лексику
    const profanityCheck = checkProfanity(disputeText);
    if (profanityCheck.hasProfanity) {
      toast.error(PROFANITY_WARNING, { duration: 5000 });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${userId}/reviews/${reviewId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ disputeText: disputeText.trim(), disputeImages: images }),
      });
      if (res.ok) {
        toast.success('Спор отправлен на рассмотрение администратору');
        onSuccess();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Ошибка');
      }
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
      <h4 className="font-bold text-red-700 dark:text-red-400 text-sm mb-2">Оспорить отзыв</h4>
      <p className="text-xs text-red-600 dark:text-red-300 mb-3">
        Отзыв будет отправлен администратору на рассмотрение
      </p>
      <textarea
        value={disputeText}
        onChange={e => setDisputeText(e.target.value)}
        placeholder="Опишите причину оспаривания..."
        maxLength={2000}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
      />
      <p className="text-[10px] text-gray-400 mt-1 text-right">{disputeText.length}/2000</p>

      {/* Image upload */}
      <div className="mt-2">
        <div className="flex flex-wrap gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden">
              <Image src={img} alt="Фото спора" fill className="object-cover" sizes="64px" unoptimized />
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px]"
              >
                ×
              </button>
            </div>
          ))}
          {images.length < 5 && (
            <label className="w-16 h-16 rounded-lg border-2 border-dashed border-red-200 dark:border-red-800 flex items-center justify-center cursor-pointer hover:border-red-400 transition-colors">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              {uploading ? (
                <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            </label>
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Доказательства (до 5 фото)</p>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSubmit}
          disabled={submitting || !disputeText.trim()}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Отправка...' : 'Отправить спор'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
