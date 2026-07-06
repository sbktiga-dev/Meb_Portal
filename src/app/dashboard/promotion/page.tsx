'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

interface Subscription {
  id: string;
  plan: string;
  period: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

interface PostOption { id: string; title: string; category: string }

interface PromotionData {
  id: string; status: string; startDate: string; endDate: string; createdAt: string;
  post: { id: string; title: string; category: string };
}

interface BannerData {
  id: string; title: string; imageUrl: string; linkUrl: string; position: string;
  status: string; startDate: string; endDate: string; createdAt: string;
}

const PLANS = {
  lite: {
    name: 'Lite',
    features: ['Продвижение постов в ленте', '1 баннер в ленте или каталоге', 'Метка «Продвижено»'],
    monthly: 1500,
    yearly: 15000,
  },
  pro: {
    name: 'Pro',
    features: ['Продвижение постов в ленте', 'Безлимитные баннеры', 'Метка «Продвижено»', 'Приоритет в результатах поиска'],
    monthly: 4000,
    yearly: 40000,
  },
};

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

function formatPrice(n: number) { return n.toLocaleString('ru-RU') + ' ₽'; }

export default function PromotionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [posts, setPosts] = useState<PostOption[]>([]);
  const [promotions, setPromotions] = useState<PromotionData[]>([]);
  const [banners, setBanners] = useState<BannerData[]>([]);

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const [selectedPostId, setSelectedPostId] = useState('');
  const [bannerForm, setBannerForm] = useState({ title: '', imageUrl: '', linkUrl: '', position: 'both', targetCategory: 'all' });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    try {
      const [meRes, subRes, postsRes, promosRes, bannersRes] = await Promise.all([
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/subscription', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/posts?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/promotion', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/promotion/banners', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const me = await meRes.json();
      if (me.user?.role === 'CLIENT') { router.push('/dashboard'); return; }

      const subData = await subRes.json();
      setSubscription(subData.subscription || null);

      const postsData = await postsRes.json();
      setPosts((postsData.posts || []).map((p: PostOption) => ({ id: p.id, title: p.title, category: p.category })));

      const promosData = await promosRes.json();
      setPromotions(promosData.promotions || []);

      const bannersData = await bannersRes.json();
      setBanners(bannersData.banners || []);
    } catch {
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubscribe = async (plan: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setSubscribing(true);
    try {
      const res = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan, period: billingPeriod }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Ошибка');
        return;
      }
      toast.success('Заявка на подписку отправлена! Ожидает подтверждения администратора.');
      setSelectedPlan(null);
      loadData();
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription || subscription.status !== 'pending') return;
    if (!confirm('Отменить заявку на подписку?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`/api/subscription/${subscription.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { toast.success('Заявка отменена'); loadData(); }
    } catch { toast.error('Ошибка'); }
  };

  const handleCreatePromotion = async () => {
    if (!selectedPostId) { toast.error('Выберите пост'); return; }
    if (!subscription) { toast.error('Необходима подписка'); return; }
    const token = localStorage.getItem('token');
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/promotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ postId: selectedPostId, duration: subscription.period === 'yearly' ? 30 : 30 }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Ошибка');
        return;
      }
      toast.success('Заявка на продвижение поста отправлена!');
      setSelectedPostId('');
      loadData();
    } catch { toast.error('Ошибка сети'); }
    finally { setSubmitting(false); }
  };

  const handleCreateBanner = async () => {
    if (!bannerForm.title || !bannerForm.imageUrl || !bannerForm.linkUrl) {
      toast.error('Заполните все поля баннера'); return;
    }
    if (!subscription) { toast.error('Необходима подписка'); return; }
    const token = localStorage.getItem('token');
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/promotion/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...bannerForm, duration: 30 }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Ошибка');
        return;
      }
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

  const isActive = subscription?.status === 'active';
  const isPending = subscription?.status === 'pending';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto">
        <div className="max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Продвижение</h1>
          <p className="text-gray-500 mb-8">Подписка для продвижения вашего контента</p>

          {/* Текущая подписка */}
          {subscription && (
            <div className={`rounded-xl p-5 mb-6 border ${isActive ? 'bg-green-50 border-green-200' : isPending ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-bold text-gray-900">
                    {isActive ? 'Подписка активна' : isPending ? 'Заявка ожидает подтверждения' : 'Подписка неактивна'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    План: <span className="font-semibold">{subscription.plan === 'lite' ? 'Lite' : 'Pro'}</span>
                    {' · '}
                    {subscription.period === 'monthly' ? 'Ежемесячная' : 'Ежегодная'}
                    {subscription.endDate && isActive && (
                      <> · Действует до {new Date(subscription.endDate).toLocaleDateString('ru-RU')}</>
                    )}
                  </p>
                </div>
                {isPending && (
                  <button onClick={handleCancelSubscription} className="text-red-600 hover:text-red-700 text-sm font-medium px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition">
                    Отменить
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Тарифы */}
          {!subscription && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-bold text-gray-900">Выберите план</h2>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setBillingPeriod('monthly')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${billingPeriod === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                    Ежемесячно
                  </button>
                  <button onClick={() => setBillingPeriod('yearly')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${billingPeriod === 'yearly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                    Ежегодно <span className="text-green-600 text-xs">-17%</span>
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                {(Object.entries(PLANS) as [string, typeof PLANS.lite][]).map(([key, plan]) => {
                  const price = billingPeriod === 'monthly' ? plan.monthly : plan.yearly;
                  const perMonth = billingPeriod === 'yearly' ? Math.round(plan.yearly / 12) : plan.monthly;
                  const isLite = key === 'lite';
                  return (
                    <div key={key} className={`rounded-xl border-2 p-6 transition-all ${selectedPlan === key ? 'border-brand-500 shadow-lg shadow-brand-100' : 'border-gray-200 hover:border-gray-300'} ${!isLite ? 'relative' : ''}`}>
                      {!isLite && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">Популярный</div>}
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-3xl font-bold text-gray-900">{formatPrice(price)}</span>
                        <span className="text-gray-500 text-sm">/{billingPeriod === 'monthly' ? 'мес' : 'год'}</span>
                        {billingPeriod === 'yearly' && <p className="text-sm text-green-600 mt-1">{formatPrice(perMonth)}/мес</p>}
                      </div>
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => setSelectedPlan(key)}
                        disabled={subscribing}
                        className={`w-full py-3 rounded-lg font-medium transition ${isLite ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-brand-500 text-white hover:bg-brand-600'}`}
                      >
                        {subscribing && selectedPlan === key ? 'Отправка...' : 'Оформить'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-sm text-gray-400 mt-4">
                Оплата по телефону · Администратор активирует подписку в течение 24 часов
              </p>
            </div>
          )}

          {/* Форма продвижения (только для подписчиков) */}
          {isActive && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Продвижение</h2>

              {/* Продвижение поста */}
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-900 mb-1">Продвижение поста</h3>
                <p className="text-sm text-gray-500 mb-3">Пост закрепляется вверху ленты с меткой «Продвижено»</p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Выберите пост</label>
                    <select value={selectedPostId} onChange={e => setSelectedPostId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2">
                      <option value="">— Выберите пост —</option>
                      {posts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  <button onClick={handleCreatePromotion} disabled={submitting || !selectedPostId} className="bg-brand-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-600 transition disabled:opacity-50">
                    {submitting ? '...' : 'Продвинуть'}
                  </button>
                </div>
              </div>

              {/* Баннер */}
              {subscription.plan === 'pro' || banners.length < 1 ? (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-1">Создать баннер</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    {subscription.plan === 'lite' ? 'Лимит: 1 баннер для плана Lite' : 'Безлимитные баннеры для плана Pro'}
                  </p>
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                        <input type="text" value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2" placeholder="Скидки на кухни" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка</label>
                        <input type="url" value={bannerForm.linkUrl} onChange={e => setBannerForm({ ...bannerForm, linkUrl: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2" placeholder="https://example.com" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL изображения</label>
                      <input type="url" value={bannerForm.imageUrl} onChange={e => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2" placeholder="https://example.com/banner.jpg" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Размещение</label>
                        <select value={bannerForm.position} onChange={e => setBannerForm({ ...bannerForm, position: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2">
                          <option value="both">Лента + Каталог</option>
                          <option value="feed">Только лента</option>
                          <option value="gallery">Только каталог</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Аудитория</label>
                        <select value={bannerForm.targetCategory} onChange={e => setBannerForm({ ...bannerForm, targetCategory: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2">
                          {TARGET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <button onClick={handleCreateBanner} disabled={submitting} className="bg-brand-500 text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-600 transition disabled:opacity-50">
                      {submitting ? '...' : 'Создать баннер'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                  Лимит баннеров исчерпан (1 для Lite). Удалите текущий баннер или обновите подписку до Pro.
                </div>
              )}
            </div>
          )}

          {/* Мои заявки */}
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

          {/* Контакты */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Оплата</h2>
            <p className="text-gray-500 text-sm mb-4">Для оплаты подписки свяжитесь с нами по телефону</p>
            <a href="tel:+79001234567" className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-600 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Позвонить
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
