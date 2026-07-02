'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface PostOption {
  id: string;
  title: string;
  category: string;
}

interface PromotionData {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  post: { id: string; title: string; category: string };
}

interface BannerData {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

const DURATIONS = [
  { value: 7, label: '7 дней', price: '1 500 руб.' },
  { value: 14, label: '14 дней', price: '2 500 руб.' },
  { value: 30, label: '30 дней', price: '4 000 руб.' },
];

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
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [promotions, setPromotions] = useState<PromotionData[]>([]);
  const [banners, setBanners] = useState<BannerData[]>([]);

  const [promotePost, setPromotePost] = useState(false);
  const [bannerFeed, setBannerFeed] = useState(false);
  const [bannerGallery, setBannerGallery] = useState(false);

  const [selectedPostId, setSelectedPostId] = useState('');
  const [postDuration, setPostDuration] = useState(7);
  const [bannerFeedDuration, setBannerFeedDuration] = useState(7);
  const [bannerGalleryDuration, setBannerGalleryDuration] = useState(7);

  const [bannerFeedForm, setBannerFeedForm] = useState({ title: '', imageUrl: '', linkUrl: '', targetCategory: 'all' });
  const [bannerGalleryForm, setBannerGalleryForm] = useState({ title: '', imageUrl: '', linkUrl: '', targetCategory: 'all' });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    try {
      const [meRes, postsRes, promosRes, bannersRes] = await Promise.all([
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/posts?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/promotion', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/promotion/banners', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const me = await meRes.json();
      if (me.user?.role === 'CLIENT') { router.push('/dashboard'); return; }

      const postsData = await postsRes.json();
      setPosts((postsData.posts || []).map((p: { id: string; title: string; category: string }) => ({
        id: p.id, title: p.title, category: p.category,
      })));

      const promosData = await promosRes.json();
      setPromotions(promosData.promotions || []);

      const bannersData = await bannersRes.json();
      setBanners(bannersData.banners || []);
    } catch {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async () => {
    if (!promotePost && !bannerFeed && !bannerGallery) {
      setError('Выберите хотя бы один тип продвижения');
      return;
    }

    if (promotePost && !selectedPostId) {
      setError('Выберите пост для продвижения');
      return;
    }

    if (bannerFeed && (!bannerFeedForm.title || !bannerFeedForm.imageUrl || !bannerFeedForm.linkUrl)) {
      setError('Заполните все поля для баннера в ленте');
      return;
    }

    if (bannerGallery && (!bannerGalleryForm.title || !bannerGalleryForm.imageUrl || !bannerGalleryForm.linkUrl)) {
      setError('Заполните все поля для баннера в каталоге');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const requests: Promise<Response>[] = [];

      if (promotePost) {
        requests.push(
          fetch('/api/promotion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ postId: selectedPostId, duration: postDuration }),
          })
        );
      }

      if (bannerFeed) {
        requests.push(
          fetch('/api/promotion/banners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...bannerFeedForm, position: 'feed', duration: bannerFeedDuration }),
          })
        );
      }

      if (bannerGallery) {
        requests.push(
          fetch('/api/promotion/banners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...bannerGalleryForm, position: 'gallery', duration: bannerGalleryDuration }),
          })
        );
      }

      const results = await Promise.all(requests);
      const allOk = results.every(r => r.ok);

      if (allOk) {
        setSuccess('Заявка отправлена! Ожидает подтверждения администратора.');
        setPromotePost(false);
        setBannerFeed(false);
        setBannerGallery(false);
        setSelectedPostId('');
        setBannerFeedForm({ title: '', imageUrl: '', linkUrl: '', targetCategory: 'all' });
        setBannerGalleryForm({ title: '', imageUrl: '', linkUrl: '', targetCategory: 'all' });
        loadData();
      } else {
        setError('Ошибка при отправке одной из заявок');
      }
    } catch {
      setError('Ошибка сервера');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (type: 'promotion' | 'banner', id: string) => {
    if (!confirm('Отменить заявку?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const url = type === 'promotion' ? `/api/promotion/${id}` : `/api/promotion/banners/${id}`;
    await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadData();
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
          <p className="text-gray-500 mb-8">Продвижение вашего профиля и контента</p>

          {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">{error}</div>}
          {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg mb-4">{success}</div>}

          {/* Что даёт продвижение */}
          <div className="bg-gradient-to-r from-brand-50 to-orange-50 border border-brand-100 rounded-xl p-5 mb-6">
            <h2 className="font-bold text-gray-900 mb-3">Что даёт продвижение?</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Видимость</p>
                  <p className="text-xs text-gray-500">Ваш контент показывается первым тысячам пользователей</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Охват</p>
                  <p className="text-xs text-gray-500">Привлекаете новых клиентов и партнёров к вашему профилю</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Доверие</p>
                  <p className="text-xs text-gray-500">Специальная метка «Продвижено» повышает лояльность</p>
                </div>
              </div>
            </div>
          </div>

          {/* Секция 1: Форма заявки */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Создать заявку на продвижение</h2>

            {/* Продвижение поста */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promotePost}
                  onChange={e => setPromotePost(e.target.checked)}
                  className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                />
                <span className="font-medium text-gray-900">Продвижение поста</span>
              </label>
              <p className="text-sm text-gray-500 mt-1 ml-8">Ваш пост закрепляется вверху ленты новостей с меткой «Продвижено». Пользователи видят его первым при входе на сайт.</p>
              {promotePost && (
                <div className="mt-4 ml-8 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Выберите пост</label>
                    <select
                      value={selectedPostId}
                      onChange={e => setSelectedPostId(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2"
                    >
                      <option value="">— Выберите пост —</option>
                      {posts.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Срок</label>
                    <div className="flex gap-2">
                      {DURATIONS.map(d => (
                        <button
                          key={d.value}
                          onClick={() => setPostDuration(d.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            postDuration === d.value
                              ? 'bg-brand-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {d.label}
                          <span className="block text-xs opacity-75">{d.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Баннер в ленте */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bannerFeed}
                  onChange={e => setBannerFeed(e.target.checked)}
                  className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                />
                <span className="font-medium text-gray-900">Баннер в ленте</span>
              </label>
              <p className="text-sm text-gray-500 mt-1 ml-8">Рекламный баннер отображается между постами в ленте новостей. Идеально для продвижения акций, скидок или новинок. Переход по ссылке на ваш сайт или страницу.</p>
              {bannerFeed && (
                <div className="mt-4 ml-8 space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                      <input
                        type="text"
                        value={bannerFeedForm.title}
                        onChange={e => setBannerFeedForm({ ...bannerFeedForm, title: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2"
                        placeholder="Скидки на кухни"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка</label>
                      <input
                        type="url"
                        value={bannerFeedForm.linkUrl}
                        onChange={e => setBannerFeedForm({ ...bannerFeedForm, linkUrl: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL изображения</label>
                    <input
                      type="url"
                      value={bannerFeedForm.imageUrl}
                      onChange={e => setBannerFeedForm({ ...bannerFeedForm, imageUrl: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2"
                      placeholder="https://example.com/banner.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Целевая аудитория</label>
                    <select
                      value={bannerFeedForm.targetCategory}
                      onChange={e => setBannerFeedForm({ ...bannerFeedForm, targetCategory: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2"
                    >
                      {TARGET_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Показывать пользователям, интересующимся этой категорией мебели</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Срок</label>
                    <div className="flex gap-2">
                      {DURATIONS.map(d => (
                        <button
                          key={d.value}
                          onClick={() => setBannerFeedDuration(d.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            bannerFeedDuration === d.value
                              ? 'bg-brand-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {d.label}
                          <span className="block text-xs opacity-75">{d.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Баннер в каталоге */}
            <div className="border border-gray-200 rounded-lg p-4 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bannerGallery}
                  onChange={e => setBannerGallery(e.target.checked)}
                  className="w-5 h-5 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                />
                <span className="font-medium text-gray-900">Баннер в каталоге изображений</span>
              </label>
              <p className="text-sm text-gray-500 mt-1 ml-8">Баннер над сеткой изображений в каталоге. Показывается всем, кто просматривает галерею — одно из самых посещаемых мест портала. Клик ведёт на вашу страницу.</p>
              {bannerGallery && (
                <div className="mt-4 ml-8 space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                      <input
                        type="text"
                        value={bannerGalleryForm.title}
                        onChange={e => setBannerGalleryForm({ ...bannerGalleryForm, title: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2"
                        placeholder="Новая коллекция"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка</label>
                      <input
                        type="url"
                        value={bannerGalleryForm.linkUrl}
                        onChange={e => setBannerGalleryForm({ ...bannerGalleryForm, linkUrl: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL изображения</label>
                    <input
                      type="url"
                      value={bannerGalleryForm.imageUrl}
                      onChange={e => setBannerGalleryForm({ ...bannerGalleryForm, imageUrl: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2"
                      placeholder="https://example.com/banner.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Целевая аудитория</label>
                    <select
                      value={bannerGalleryForm.targetCategory}
                      onChange={e => setBannerGalleryForm({ ...bannerGalleryForm, targetCategory: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2"
                    >
                      {TARGET_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Показывать пользователям, интересующимся этой категорией мебели</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Срок</label>
                    <div className="flex gap-2">
                      {DURATIONS.map(d => (
                        <button
                          key={d.value}
                          onClick={() => setBannerGalleryDuration(d.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            bannerGalleryDuration === d.value
                              ? 'bg-brand-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {d.label}
                          <span className="block text-xs opacity-75">{d.price}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || (!promotePost && !bannerFeed && !bannerGallery)}
              className="bg-brand-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-600 transition disabled:opacity-50"
            >
              {submitting ? 'Отправка...' : 'Отправить заявку'}
            </button>
          </div>

          {/* Секция 2: Мои заявки */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
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
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Срок</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Статус</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {promotions.map(p => {
                      const st = STATUS_LABELS[p.status] || STATUS_LABELS.pending;
                      const days = Math.ceil((new Date(p.endDate).getTime() - new Date(p.startDate).getTime()) / 86400000);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Пост</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.post.title}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{days} дн.</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${st.color}`}>{st.text}</span></td>
                          <td className="px-4 py-3 text-right">
                            {(p.status === 'pending' || p.status === 'active') && (
                              <button onClick={() => handleCancel('promotion', p.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">Отменить</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {banners.map(b => {
                      const st = STATUS_LABELS[b.status] || STATUS_LABELS.pending;
                      const days = Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / 86400000);
                      const posLabel = b.position === 'feed' ? 'Лента' : b.position === 'gallery' ? 'Каталог' : 'Лента + Каталог';
                      return (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Баннер</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{b.title} ({posLabel})</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{days} дн.</td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${st.color}`}>{st.text}</span></td>
                          <td className="px-4 py-3 text-right">
                            {(b.status === 'pending' || b.status === 'active') && (
                              <button onClick={() => handleCancel('banner', b.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">Отменить</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Секция 3: Связаться */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Оформить подписку</h2>
            <div className="bg-brand-50 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Для оплаты и активации продвижения свяжитесь с нами по телефону.
                Мы поможем выбрать подходящий тариф и активировать вашу заявку.
              </p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Продвижение поста:</span>
                  <span>от 1 500 руб./неделя</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Баннер:</span>
                  <span>от 2 000 руб./неделя</span>
                </div>
              </div>
              <a
                href="tel:+79001234567"
                className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                Позвонить
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
