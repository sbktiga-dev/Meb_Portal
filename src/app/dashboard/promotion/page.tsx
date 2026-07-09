'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

interface PostOption { id: string; title: string; category: string }

interface PromotionData {
  id: string; status: string; startDate: string; endDate: string; createdAt: string;
  post: { id: string; title: string; category: string };
}

interface BannerData {
  id: string; title: string; imageUrl: string; linkUrl: string; position: string;
  status: string; startDate: string; endDate: string; createdAt: string;
}

const TARGET_CATEGORIES = [
  { value: 'all', label: 'Все категории' },
  { value: 'kitchens', label: 'Кухни' },
  { value: 'wardrobes', label: 'Гардеробные' },
  { value: 'tables', label: 'Столы' },
  { value: 'shelves', label: 'Стеллажи' },
  { value: 'sofas', label: 'Диваны' },
  { value: 'beds', label: 'Кровати' },
  { value: 'hardware', label: 'Фурнитура' },
  { value: 'materials', label: 'Материалы' },
];

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  pending: { text: 'Ожидает', color: 'bg-yellow-100 text-yellow-700' },
  active: { text: 'Активно', color: 'bg-green-100 text-green-700' },
  expired: { text: 'Истекло', color: 'bg-gray-100 text-gray-500' },
};

export default function PromotionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [promotions, setPromotions] = useState<PromotionData[]>([]);
  const [banners, setBanners] = useState<BannerData[]>([]);

  const [selectedPostId, setSelectedPostId] = useState('');
  const [bannerForm, setBannerForm] = useState({ title: '', imageUrl: '', linkUrl: '', position: 'both', targetCategory: 'all' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const [meRes, subRes, postsRes, promosRes, bannersRes] = await Promise.all([
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetch('/api/subscription/check', { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetch('/api/posts?limit=100', { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetch('/api/promotion', { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetch('/api/promotion/banners', { headers: { Authorization: `Bearer ${token}` }, signal }),
      ]);

      const me = await meRes.json();
      if (me.user?.role === 'CLIENT') { router.push('/dashboard'); return; }

      const subData = await subRes.json();
      setHasSubscription(subData.canPromote || false);

      const postsData = await postsRes.json();
      setPosts((postsData.posts || []).map((p: PostOption) => ({ id: p.id, title: p.title, category: p.category })));

      const promosData = await promosRes.json();
      setPromotions(promosData.promotions || []);

      const bannersData = await bannersRes.json();
      setBanners(bannersData.banners || []);
    } catch { toast.error('Ошибка загрузки'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const handleCreatePromotion = async () => {
    if (!selectedPostId) { toast.error('Выберите пост'); return; }
    const token = localStorage.getItem('token');
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/promotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId: selectedPostId, duration: 30 }),
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error); return; }
      toast.success('Заявка на продвижение отправлена!');
      setSelectedPostId('');
      loadData();
    } catch { toast.error('Ошибка сети'); }
    finally { setSubmitting(false); }
  };

  const handleCreateBanner = async () => {
    if (!bannerForm.title || !bannerForm.imageUrl || !bannerForm.linkUrl) { toast.error('Заполните все поля'); return; }
    const token = localStorage.getItem('token');
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/promotion/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...bannerForm, duration: 30 }),
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error); return; }
      toast.success('Заявка на баннер отправлена!');
      setBannerForm({ title: '', imageUrl: '', linkUrl: '', position: 'both', targetCategory: 'all' });
      loadData();
    } catch { toast.error('Ошибка сети'); }
    finally { setSubmitting(false); }
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
        <div className="max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Продвижение</h1>
          <p className="text-gray-500 mb-6">Создавайте продвижение постов и баннеры</p>

          {!hasSubscription && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
              <h2 className="font-bold text-green-800 mb-1">Продвижение бесплатно до 30 сентября 2026</h2>
              <p className="text-sm text-green-700 mb-3">Сейчас все функции продвижения доступны бесплатно. Оформите заявку и начните продвижение.</p>
              <Link href="/dashboard/tariffs" className="inline-block bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700 transition text-sm">
                Оформить бесплатно
              </Link>
            </div>
          )}

          {hasSubscription && (
            <>
              {/* Продвижение поста */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-5">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Продвижение поста</h2>
                <p className="text-sm text-gray-500 mb-3">Пост закрепляется вверху ленты с меткой «Рекомендовано»</p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <select value={selectedPostId} onChange={e => setSelectedPostId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2.5">
                      <option value="">— Выберите пост —</option>
                      {posts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  <button onClick={handleCreatePromotion} disabled={submitting || !selectedPostId}
                    className="bg-brand-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-600 transition disabled:opacity-50 whitespace-nowrap">
                    {submitting ? '...' : 'Продвинуть'}
                  </button>
                </div>
              </div>

              {/* Баннер */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-5">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Создать баннер</h2>
                <p className="text-sm text-gray-500 mb-4">Рекламный баннер в ленте и/или каталоге</p>
                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                      <input type="text" value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5" placeholder="Скидки на кухни" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка</label>
                      <input type="url" value={bannerForm.linkUrl} onChange={e => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5" placeholder="https://example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Изображение баннера</label>
                    {bannerForm.imageUrl ? (
                      <div className="relative h-40">
                        <Image src={bannerForm.imageUrl} alt="Превью" fill className="object-cover rounded-lg border border-gray-200" sizes="(max-width: 768px) 100vw, 500px" unoptimized />
                        <button onClick={() => setBannerForm({ ...bannerForm, imageUrl: '' })} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs hover:bg-red-600 transition">✕</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition">
                        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
                        <span className="text-sm text-gray-500">Нажмите или перетащите</span>
                        <span className="text-xs text-gray-400">JPG, PNG, WebP до 10 МБ</span>
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const token = localStorage.getItem('token');
                          if (!token) return;
                          const fd = new FormData();
                          fd.append('file', file);
                          try {
                            const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
                            if (res.ok) { const data = await res.json(); setBannerForm({ ...bannerForm, imageUrl: data.url }); }
                            else { toast.error('Ошибка загрузки'); }
                          } catch { toast.error('Ошибка сети'); }
                        }} />
                      </label>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Или вставьте URL:</p>
                    <input type="url" value={bannerForm.imageUrl} onChange={e => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 mt-1 text-sm" placeholder="https://example.com/banner.jpg" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Размещение</label>
                      <select value={bannerForm.position} onChange={e => setBannerForm({ ...bannerForm, position: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5">
                        <option value="both">Лента + Каталог</option>
                        <option value="feed">Только лента</option>
                        <option value="gallery">Только каталог</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Аудитория</label>
                      <select value={bannerForm.targetCategory} onChange={e => setBannerForm({ ...bannerForm, targetCategory: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2.5">
                        {TARGET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={handleCreateBanner} disabled={submitting}
                    className="bg-brand-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-600 transition disabled:opacity-50">
                    {submitting ? '...' : 'Создать баннер'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Мои заявки */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Мои заявки</h2>
            {promotions.length === 0 && banners.length === 0 ? (
              <p className="text-gray-500 text-center py-8">У вас пока нет заявок</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Тип</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Детали</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {promotions.map(p => {
                      const st = STATUS_LABELS[p.status] || STATUS_LABELS.pending;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Пост</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.post.title}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${st.color}`}>{st.text}</span></td>
                        </tr>
                      );
                    })}
                    {banners.map(b => {
                      const st = STATUS_LABELS[b.status] || STATUS_LABELS.pending;
                      const posLabel = b.position === 'feed' ? 'Лента' : b.position === 'gallery' ? 'Каталог' : 'Лента + Каталог';
                      return (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Баннер</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{b.title} ({posLabel})</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${st.color}`}>{st.text}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
