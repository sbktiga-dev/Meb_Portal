'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

interface Newsletter {
  id: string;
  title: string;
  body: string;
  recipientCount: number;
  sentAt: string;
}

export default function NewsletterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [followerCount, setFollowerCount] = useState(0);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const [nlRes, meRes] = await Promise.all([
        fetch('/api/newsletter', { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal }),
      ]);
      const nlData = await nlRes.json();
      setNewsletters(nlData.newsletters || []);

      const me = await meRes.json();
      if (me.user?.id) {
        const folRes = await fetch(`/api/users/${me.user.id}/followers?limit=1`, { headers: { Authorization: `Bearer ${token}` }, signal });
        const folData = await folRes.json();
        setFollowerCount(folData.pagination?.total || 0);
      }
    } catch { toast.error('Ошибка загрузки'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const handleSend = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setSending(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Ошибка'); return; }
      toast.success(`Рассылка отправлена ${data.recipients} подписчикам`);
      setTitle('');
      setBody('');
      loadData();
    } catch { toast.error('Ошибка сети'); }
    finally { setSending(false); }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Рассылка</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Отправьте сообщение всем подписчикам ({followerCount})
          </p>

          {/* Форма */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Заголовок</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={200}
                className="input-premium"
                placeholder="Тема рассылки"
              />
              <p className="text-xs text-gray-400 mt-1">{title.length}/200</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Текст</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                maxLength={5000}
                rows={6}
                className="input-premium resize-none"
                placeholder="Текст рассылки..."
              />
              <p className="text-xs text-gray-400 mt-1">{body.length}/5000</p>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || title.length < 3 || body.length < 10 || followerCount === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Отправка...' : `Отправить ${followerCount} подписчикам`}
            </button>
          </div>

          {/* История */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">История рассылок</h2>
            {newsletters.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">Вы ещё не отправляли рассылки</p>
            ) : (
              <div className="space-y-3">
                {newsletters.map(n => (
                  <div key={n.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{n.title}</h3>
                      <span className="text-xs text-gray-400">{new Date(n.sentAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-2">Получателей: {n.recipientCount}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
