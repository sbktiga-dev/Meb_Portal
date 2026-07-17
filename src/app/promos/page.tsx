'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

interface Promo {
  key: string;
  title: string;
  description: string;
  icon: string;
  reward: string;
  conditions: string[];
  type: string;
  permanent: boolean;
  startDate?: string;
  endDate?: string;
  color: string;
  myStatus: string | null;
}

export default function PromosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch('/api/promos', { headers });
      const data = await res.json();
      setPromos(data.promos || []);
    } catch { toast.error('Ошибка загрузки'); }
    finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!selectedPromo) return;
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/promos/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          promoKey: selectedPromo.key,
          proofUrl: proofUrl || undefined,
          proofImages: proofImages.length > 0 ? proofImages : undefined,
          note: note || undefined,
        }),
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error); return; }
      toast.success('Заявка отправлена!');
      setSelectedPromo(null);
      setProofUrl('');
      setProofImages([]);
      setNote('');
      loadPromos();
    } catch { toast.error('Ошибка сети'); }
    finally { setSubmitting(false); }
  };

  const uploadProofImage = async (file: File) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (res.ok) { const data = await res.json(); setProofImages(prev => [...prev, data.url]); }
      else { toast.error('Ошибка загрузки'); }
    } catch { toast.error('Ошибка сети'); }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return null;
    const labels: Record<string, { text: string; color: string }> = {
      pending: { text: 'На рассмотрении', color: 'bg-yellow-100 text-yellow-700' },
      approved: { text: 'Одобрено', color: 'bg-green-100 text-green-700' },
      rejected: { text: 'Отклонено', color: 'bg-red-100 text-red-700' },
      completed: { text: 'Выполнено', color: 'bg-blue-100 text-blue-700' },
    };
    return labels[status] || null;
  };

  const filteredPromos = promos.filter(p => {
    if (filter === 'active') return !p.myStatus || p.myStatus === 'pending';
    if (filter === 'completed') return p.myStatus === 'approved' || p.myStatus === 'completed';
    return true;
  });

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
        <div className="max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Акции от МебПортал</h1>
            <p className="text-gray-500 dark:text-gray-400">Участвуйте в акциях и получайте бонусы</p>
          </div>

          {/* Фильтры */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'all', label: 'Все' },
              { key: 'active', label: 'Доступные' },
              { key: 'completed', label: 'Мои участия' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key as typeof filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f.key ? 'bg-brand-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Карточки акций */}
          <div className="grid md:grid-cols-2 gap-5">
            {filteredPromos.map(promo => {
              const status = getStatusLabel(promo.myStatus);
              const isExpired = !promo.permanent && promo.endDate && new Date(promo.endDate) < new Date();
              return (
                <div key={promo.key} className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden border ${isExpired ? 'border-gray-200 dark:border-gray-700 opacity-60' : 'border-gray-100 dark:border-gray-700'}`}>
                  <div className={`bg-gradient-to-r ${promo.color} p-5 text-white`}>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{promo.icon}</span>
                      <div>
                        <h3 className="font-bold text-lg">{promo.title}</h3>
                        {!promo.permanent && promo.startDate && promo.endDate && (
                          <p className="text-white/80 text-xs mt-0.5">
                            {new Date(promo.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — {new Date(promo.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{promo.description}</p>
                    <div className="bg-brand-50 dark:bg-brand-500/10 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-brand-700 dark:text-brand-400">Награда: {promo.reward}</p>
                    </div>
                    <div className="space-y-1.5 mb-4">
                      {promo.conditions.map((c, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="text-brand-500 mt-0.5">•</span>
                          {c}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      {status ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.text}</span>
                      ) : (
                        <span />
                      )}
                      {!isExpired && (!promo.myStatus || promo.myStatus === 'rejected') && (
                        <button onClick={() => setSelectedPromo(promo)}
                          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition">
                          Участвовать
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPromos.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p>Нет акций для отображения</p>
            </div>
          )}
        </div>
      </div>

      {/* Модал участия */}
      {selectedPromo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedPromo(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedPromo.icon}</span>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{selectedPromo.title}</h3>
                </div>
                <button onClick={() => setSelectedPromo(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {selectedPromo.type === 'manual' ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Загрузите доказательства размещения виджета:</p>

                  {/* Ссылка на сайт */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ссылка на ваш сайт</label>
                    <input type="url" value={proofUrl} onChange={e => setProofUrl(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm"
                      placeholder="https://example.com" />
                  </div>

                  {/* Скриншоты */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Скриншоты с виджетом</label>
                    <div className="flex flex-wrap gap-2">
                      {proofImages.map((url, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                          <Image src={url} alt="" fill className="object-cover" sizes="80px" unoptimized />
                          <button onClick={() => setProofImages(prev => prev.filter((_, j) => j !== i))}
                            className="absolute top-1 right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[10px]">✕</button>
                        </div>
                      ))}
                      {proofImages.length < 5 && (
                        <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 transition">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                          <input type="file" accept="image/*" className="hidden" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) uploadProofImage(file);
                          }} />
                        </label>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Загрузите скриншот страницы с виджетом (до 5 фото)</p>
                  </div>

                  {/* Комментарий */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Комментарий (необязательно)</label>
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm"
                      placeholder="Дополнительная информация..." />
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Для участия в этой акции достаточно выполнить условия. Награда начислится автоматически.</p>
                  <div className="bg-green-50 dark:bg-green-500/10 rounded-lg p-4">
                    <p className="text-green-700 dark:text-green-400 text-sm font-medium">Условия:</p>
                    <ul className="mt-2 space-y-1">
                      {selectedPromo.conditions.map((c, i) => (
                        <li key={i} className="text-sm text-green-600 dark:text-green-400 flex items-start gap-2">
                          <span>•</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button onClick={handleJoin} disabled={submitting || (selectedPromo.type === 'manual' && !proofUrl)}
                  className="flex-1 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition disabled:opacity-50">
                  {submitting ? 'Отправка...' : 'Отправить заявку'}
                </button>
                <button onClick={() => setSelectedPromo(null)}
                  className="px-5 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
