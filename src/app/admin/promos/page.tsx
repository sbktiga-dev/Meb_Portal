'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { PROMOS } from '@/lib/promos';

interface Participation {
  id: string;
  promoKey: string;
  status: string;
  proofUrl: string | null;
  proofImages: string;
  note: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; role: string };
}

export default function AdminPromosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [filter, setFilter] = useState('pending');
  const [acting, setActing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.user?.role !== 'ADMIN') router.push('/dashboard'); })
      .catch(() => router.push('/login'));
  }, [router]);

  const loadData = async (status = filter) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const params = status !== 'all' ? `?status=${status}` : '';
      const res = await fetch(`/api/admin/promos${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setParticipations(data.participations || []);
    } catch { toast.error('Ошибка загрузки'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [filter]);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    if (!confirm(status === 'approved' ? 'Одобрить заявку?' : 'Отклонить заявку?')) return;
    setActing(id);
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/admin/promos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) { toast.error('Ошибка'); return; }
      toast.success(status === 'approved' ? 'Заявка одобрена' : 'Заявка отклонена');
      loadData();
    } catch { toast.error('Ошибка'); }
    finally { setActing(null); }
  };

  const parseImages = (s: string): string[] => { try { return JSON.parse(s); } catch { return []; } };

  const getPromoInfo = (key: string) => PROMOS.find(p => p.key === key);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Заявки на акции</h1>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'pending', label: 'Ожидает' },
            { key: 'approved', label: 'Одобрено' },
            { key: 'rejected', label: 'Отклонено' },
            { key: 'all', label: 'Все' },
          ].map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setLoading(true); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f.key ? 'bg-amber-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {participations.length === 0 ? (
          <p className="text-center py-8 text-gray-500">Нет заявок</p>
        ) : (
          <div className="space-y-3">
            {participations.map(p => {
              const promo = getPromoInfo(p.promoKey);
              const images = parseImages(p.proofImages);
              const isExpanded = expandedId === p.id;
              return (
                <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                  <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{promo?.icon || '🎁'}</span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{promo?.title || p.promoKey}</div>
                        <div className="text-xs text-gray-500">{p.user.name || p.user.email} · {new Date(p.createdAt).toLocaleDateString('ru-RU')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : p.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.status === 'pending' ? 'Ожидает' : p.status === 'approved' ? 'Одобрено' : 'Отклонено'}
                      </span>
                      {p.status === 'pending' && (
                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleAction(p.id, 'approved')} disabled={acting === p.id} className="text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50">Одобрить</button>
                          <button onClick={() => handleAction(p.id, 'rejected')} disabled={acting === p.id} className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50">Отклонить</button>
                        </div>
                      )}
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t dark:border-gray-700 p-4 space-y-3">
                      {p.proofUrl && (
                        <div>
                          <span className="text-xs text-gray-500">Ссылка на сайт:</span>
                          <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="block text-sm text-brand-600 hover:text-brand-700 truncate">{p.proofUrl}</a>
                        </div>
                      )}
                      {images.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-500 block mb-2">Скриншоты:</span>
                          <div className="flex flex-wrap gap-2">
                            {images.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block relative w-32 h-24 rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition">
                                <Image src={url} alt="" fill className="object-cover" sizes="128px" unoptimized />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {p.note && (
                        <div>
                          <span className="text-xs text-gray-500">Комментарий:</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{p.note}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
