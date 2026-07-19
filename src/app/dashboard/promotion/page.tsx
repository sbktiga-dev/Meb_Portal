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
  bannerType: string; images: string;
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

const BANNER_TYPES = [
  { key: 'standard', label: 'Стандартный', desc: '1 картинка' },
  { key: 'panorama', label: 'Панорама', desc: '5 картинок в ряд' },
  { key: 'mini', label: 'Мини баннер', desc: 'Компактный баннер' },
];

export default function PromotionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [notifyNewCompanies, setNotifyNewCompanies] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [promotions, setPromotions] = useState<PromotionData[]>([]);
  const [banners, setBanners] = useState<BannerData[]>([]);

  const [selectedPostId, setSelectedPostId] = useState('');
  const [bannerForm, setBannerForm] = useState({
    title: '', imageUrl: '', linkUrl: '', position: 'both', targetCategory: 'all',
    bannerType: 'standard', images: ['', '', '', '', ''],
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerData | null>(null);

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
      const allowedRoles = ['USER', 'COMPANY', 'SUPPLIER', 'MANUFACTURER', 'ADMIN'];
      if (!allowedRoles.includes(me.user?.role)) { router.push('/dashboard'); return; }
      setUserRole(me.user?.role || '');

      const subData = await subRes.json();
      setHasSubscription(subData.canPromote || false);

      // Load supplier notification settings
      if (me.user?.role === 'SUPPLIER') {
        const settingsRes = await fetch('/api/supplier/settings', { headers: { Authorization: `Bearer ${token}` }, signal });
        const settingsData = await settingsRes.json();
        setNotifyNewCompanies(settingsData.notifyNewCompanies || false);
      }

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
    if (!bannerForm.title || !bannerForm.linkUrl) { toast.error('Заполните название и ссылку'); return; }
    if (bannerForm.bannerType === 'standard' && !bannerForm.imageUrl) { toast.error('Загрузите изображение'); return; }
    if (bannerForm.bannerType === 'panorama' && bannerForm.images.filter(Boolean).length < 5) { toast.error('Загрузите все 5 изображений для панорамы'); return; }
    if (bannerForm.bannerType === 'mini' && !bannerForm.imageUrl) { toast.error('Загрузите изображение'); return; }

    const token = localStorage.getItem('token');
    if (!token) return;
    setSubmitting(true);
    try {
      const body: Record<string, any> = {
        title: bannerForm.title,
        linkUrl: bannerForm.linkUrl,
        position: bannerForm.position,
        targetCategory: bannerForm.targetCategory,
        bannerType: bannerForm.bannerType,
        duration: 30,
      };
      if (bannerForm.bannerType === 'panorama') {
        body.images = bannerForm.images.filter(Boolean);
        body.imageUrl = bannerForm.images[0] || '';
      } else {
        body.imageUrl = bannerForm.imageUrl;
      }

      const res = await fetch('/api/promotion/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error); return; }
      toast.success('Заявка на баннер отправлена!');
      setBannerForm({ title: '', imageUrl: '', linkUrl: '', position: 'both', targetCategory: 'all', bannerType: 'standard', images: ['', '', '', '', ''] });
      loadData();
    } catch { toast.error('Ошибка сети'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Удалить баннер?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`/api/promotion/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { toast.error('Ошибка удаления'); return; }
      toast.success('Баннер удалён');
      loadData();
    } catch { toast.error('Ошибка сети'); }
  };

  const handleEditBanner = (banner: BannerData) => {
    const imgs = (() => { try { return JSON.parse(banner.images); } catch { return []; } })();
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl,
      position: banner.position,
      targetCategory: 'all',
      bannerType: banner.bannerType || 'standard',
      images: imgs.length >= 5 ? imgs : ['', '', '', '', ''],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateBanner = async () => {
    if (!editingBanner) return;
    if (!bannerForm.title || !bannerForm.linkUrl) { toast.error('Заполните название и ссылку'); return; }
    const token = localStorage.getItem('token');
    if (!token) return;
    setSubmitting(true);
    try {
      const body: Record<string, any> = {
        title: bannerForm.title,
        linkUrl: bannerForm.linkUrl,
        position: bannerForm.position,
        targetCategory: bannerForm.targetCategory,
        bannerType: bannerForm.bannerType,
      };
      if (bannerForm.bannerType === 'panorama') {
        body.images = bannerForm.images.filter(Boolean);
        body.imageUrl = bannerForm.images[0] || '';
      } else {
        body.imageUrl = bannerForm.imageUrl;
      }

      const res = await fetch(`/api/promotion/banners/${editingBanner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const data = await res.json(); toast.error(data.error); return; }
      toast.success('Баннер обновлён!');
      setEditingBanner(null);
      setBannerForm({ title: '', imageUrl: '', linkUrl: '', position: 'both', targetCategory: 'all', bannerType: 'standard', images: ['', '', '', '', ''] });
      loadData();
    } catch { toast.error('Ошибка сети'); }
    finally { setSubmitting(false); }
  };

  const uploadPanoramaImage = async (index: number, file: File) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (res.ok) {
        const data = await res.json();
        const newImages = [...bannerForm.images];
        newImages[index] = data.url;
        setBannerForm({ ...bannerForm, images: newImages });
      } else { toast.error('Ошибка загрузки'); }
    } catch { toast.error('Ошибка сети'); }
  };

  const parseImages = (imagesStr: string): string[] => {
    try { return JSON.parse(imagesStr); } catch { return []; }
  };

  const toggleNotifyNewCompanies = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setNotifyLoading(true);
    try {
      const res = await fetch('/api/supplier/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifyNewCompanies: !notifyNewCompanies }),
      });
      if (res.ok) {
        setNotifyNewCompanies(!notifyNewCompanies);
        toast.success(!notifyNewCompanies ? 'Уведомления включены' : 'Уведомления выключены');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Ошибка');
      }
    } catch { toast.error('Ошибка сети'); }
    setNotifyLoading(false);
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

          {/* Supplier notification settings */}
          {userRole === 'SUPPLIER' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-5">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Уведомления</h2>
              <p className="text-sm text-gray-500 mb-4">Настройте уведомления о новом контенте на портале</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Новые компании и производства</p>
                  <p className="text-sm text-gray-500">Получать уведомления, когда на портале регистрируется новая компания или производство</p>
                </div>
                <button
                  onClick={toggleNotifyNewCompanies}
                  disabled={!hasSubscription || notifyLoading}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    hasSubscription
                      ? notifyNewCompanies ? 'bg-brand-500' : 'bg-gray-300'
                      : 'bg-gray-200 cursor-not-allowed'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    notifyNewCompanies ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              {!hasSubscription && (
                <p className="text-xs text-amber-600 mt-2">Требуется активная подписка</p>
              )}
            </div>
          )}

          {hasSubscription && (
            <>
              {/* Продвижение поста */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-5">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Продвижение поста</h2>
                <p className="text-sm text-gray-500 mb-3">Пост закрепляется вверху ленты с меткой «Рекомендовано»</p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <select value={selectedPostId} onChange={e => setSelectedPostId(e.target.value)} className="input-premium">
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
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-5">
                <h2 className="text-lg font-bold text-gray-900 mb-1">{editingBanner ? 'Редактировать баннер' : 'Создать баннер'}</h2>
                <p className="text-sm text-gray-500 mb-4">Рекламный баннер в ленте и/или каталоге</p>

                {/* Тип баннера */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Тип баннера</label>
                  <div className="flex gap-2">
                    {BANNER_TYPES.map(bt => (
                      <button key={bt.key} type="button" onClick={() => setBannerForm({ ...bannerForm, bannerType: bt.key })}
                        className={`flex-1 px-4 py-3 rounded-xl text-center transition-all border-2 ${
                          bannerForm.bannerType === bt.key
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400'
                        }`}>
                        <div className="font-medium text-sm">{bt.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{bt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                      <input type="text" value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} className="input-premium" placeholder="Скидки на кухни" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка</label>
                      <input type="url" value={bannerForm.linkUrl} onChange={e => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} className="input-premium" placeholder="https://example.com" />
                    </div>
                  </div>

                  {/* Изображение для стандартного/мини */}
                  {bannerForm.bannerType !== 'panorama' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Изображение баннера</label>
                      {bannerForm.imageUrl ? (
                        <div className="relative h-40">
                          <Image src={bannerForm.imageUrl} alt="Превью" fill className="object-cover rounded-lg border border-gray-200 dark:border-gray-600" sizes="(max-width: 768px) 100vw, 500px" unoptimized />
                          <button onClick={() => setBannerForm({ ...bannerForm, imageUrl: '' })} className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs hover:bg-red-600 transition">✕</button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 transition">
                          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
                          <span className="text-sm text-gray-500">Нажмите или перетащите</span>
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
                    </div>
                  )}

                  {/* 5 изображений для панорамы */}
                  {bannerForm.bannerType === 'panorama' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">5 изображений для панорамы</label>
                      <div className="grid grid-cols-5 gap-2">
                        {bannerForm.images.map((url, i) => (
                          <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 border border-gray-200 dark:border-gray-600">
                            {url ? (
                              <>
                                <Image src={url} alt={`Фото ${i + 1}`} fill className="object-cover" sizes="100px" unoptimized />
                                <button onClick={() => {
                                  const newImages = [...bannerForm.images];
                                  newImages[i] = '';
                                  setBannerForm({ ...bannerForm, images: newImages });
                                }} className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] hover:bg-red-600">✕</button>
                              </>
                            ) : (
                              <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-brand-50/50 transition">
                                <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                <span className="text-[10px] text-gray-400">{i + 1}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) uploadPanoramaImage(i, file);
                                }} />
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Загрузите ровно 5 изображений. Они будут отображаться в ряд с тонкими полосками.</p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Размещение</label>
                      <select value={bannerForm.position} onChange={e => setBannerForm({ ...bannerForm, position: e.target.value })} className="input-premium">
                        <option value="both">Лента + Каталог</option>
                        <option value="feed">Только лента</option>
                        <option value="gallery">Только каталог</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Аудитория</label>
                      <select value={bannerForm.targetCategory} onChange={e => setBannerForm({ ...bannerForm, targetCategory: e.target.value })} className="input-premium">
                        {TARGET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {editingBanner ? (
                      <>
                        <button onClick={handleUpdateBanner} disabled={submitting}
                          className="bg-brand-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-600 transition disabled:opacity-50">
                          {submitting ? '...' : 'Сохранить'}
                        </button>
                        <button onClick={() => { setEditingBanner(null); setBannerForm({ title: '', imageUrl: '', linkUrl: '', position: 'both', targetCategory: 'all', bannerType: 'standard', images: ['', '', '', '', ''] }); }}
                          className="px-5 py-2.5 rounded-lg font-medium border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                          Отмена
                        </button>
                      </>
                    ) : (
                      <button onClick={handleCreateBanner} disabled={submitting}
                        className="bg-brand-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-600 transition disabled:opacity-50">
                        {submitting ? '...' : 'Создать баннер'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Мои заявки */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Мои заявки</h2>
            {promotions.length === 0 && banners.length === 0 ? (
              <p className="text-gray-500 text-center py-8">У вас пока нет заявок</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Тип</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Детали</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Статус</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {promotions.map(p => {
                      const st = STATUS_LABELS[p.status] || STATUS_LABELS.pending;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Пост</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.post.title}</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${st.color}`}>{st.text}</span></td>
                          <td className="px-4 py-3 text-right"></td>
                        </tr>
                      );
                    })}
                    {banners.map(b => {
                      const st = STATUS_LABELS[b.status] || STATUS_LABELS.pending;
                      const posLabel = b.position === 'feed' ? 'Лента' : b.position === 'gallery' ? 'Каталог' : 'Лента + Каталог';
                      const typeLabel = b.bannerType === 'panorama' ? 'Панорама' : b.bannerType === 'mini' ? 'Мини' : 'Стандарт';
                      return (
                        <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            Баннер
                            <span className="text-xs text-gray-400 ml-1">({typeLabel})</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{b.title} ({posLabel})</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${st.color}`}>{st.text}</span></td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button onClick={() => handleEditBanner(b)} className="text-brand-600 hover:text-brand-700 text-sm font-medium">Редактировать</button>
                            <button onClick={() => handleDeleteBanner(b.id)} className="text-red-500 hover:text-red-600 text-sm font-medium">Удалить</button>
                          </td>
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
