'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<'bug' | 'feature'>('bug');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!message.trim()) { toast.error('Введите сообщение'); return; }
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ type, message: message.trim() }),
      });
      toast.success('Спасибо за обратную связь!');
      setMessage('');
      onClose();
    } catch {
      toast.error('Ошибка отправки');
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-float w-full max-w-md p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Обратная связь</h2>
          <button onClick={onClose} aria-label="Закрыть" className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setType('bug')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${type === 'bug' ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 'bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'}`}
          >
            Сообщить об ошибке
          </button>
          <button
            onClick={() => setType('feature')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${type === 'feature' ? 'bg-brand-50 text-brand-600 border border-brand-200 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20' : 'bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'}`}
          >
            Предложить фичу
          </button>
        </div>

        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={type === 'bug' ? 'Опишите проблему подробно...' : 'Что бы вы хотели видеть на портале?'}
          rows={5}
          className="input-premium resize-none mb-4"
          maxLength={2000}
        />

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">{message.length}/2000</span>
          <button onClick={handleSubmit} disabled={sending || !message.trim()} className="btn-primary disabled:opacity-40">
            {sending ? 'Отправка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  );
}
