'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

interface WidgetData {
  widgetHtml: string;
  embedCode: string;
  profileUrl: string;
  displayName: string;
}

export default function WidgetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [widget, setWidget] = useState<WidgetData | null>(null);
  const [copied, setCopied] = useState<'html' | 'iframe' | null>(null);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const role = d.user?.role;
        if (['COMPANY', 'SUPPLIER', 'MANUFACTURER', 'ADMIN'].includes(role)) {
          setAllowed(true);
          return fetch(`/api/widget/${d.user.id}`, { headers: { Authorization: `Bearer ${token}` } });
        }
        router.push('/dashboard');
        return null;
      })
      .then(res => res?.json())
      .then(data => { if (data) setWidget(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleCopy = async (text: string, type: 'html' | 'iframe') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success('Скопировано!');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
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

  if (!allowed || !widget) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Виджет «Мы на МебПортале»</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Разместите виджет на своём сайте, чтобы клиенты знали о вашем профиле на МебПортале</p>

          {/* Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Предпросмотр</h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 flex justify-center">
              <div dangerouslySetInnerHTML={{ __html: widget.widgetHtml }} />
            </div>
          </div>

          {/* Embed code */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Код для встраивания</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Скопируйте этот код и вставьте на свой сайт</p>
            <div className="relative">
              <pre className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto font-mono">
                {widget.embedCode}
              </pre>
              <button
                onClick={() => handleCopy(widget.embedCode, 'iframe')}
                className="absolute top-3 right-3 px-3 py-1.5 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition"
              >
                {copied === 'iframe' ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
          </div>

          {/* HTML code */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-2">HTML-код виджета</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Для более точной настройки используйте HTML-код</p>
            <div className="relative">
              <pre className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto font-mono max-h-48 overflow-y-auto">
                {widget.widgetHtml}
              </pre>
              <button
                onClick={() => handleCopy(widget.widgetHtml, 'html')}
                className="absolute top-3 right-3 px-3 py-1.5 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition"
              >
                {copied === 'html' ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Как использовать?</h3>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">1.</span>
                <span>Скопируйте код для встраивания</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">2.</span>
                <span>Вставьте его в HTML-код вашего сайта перед закрывающим тегом &lt;/body&gt;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">3.</span>
                <span>Сохраните изменения — виджет начнёт отображаться</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
