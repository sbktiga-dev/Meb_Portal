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

const PLANS = {
  lite: {
    name: 'Lite',
    features: [
      'Продвижение постов в ленте',
      '1 баннер на каждую страницу (стандартный или мини)',
      'Метка «Рекомендовано»',
      'Конструктор постов',
      'Генератор виджета',
    ],
    monthly: 490,
    yearly: 4900,
  },
  pro: {
    name: 'Pro',
    features: [
      'Продвижение постов в ленте',
      'До 2 баннеров/неделю на каждую страницу',
      'Баннеры Панорама и Мини',
      'Метка «Рекомендовано»',
      'Приоритет в каталогах',
      'Значок PRO на профиле',
      'Конструктор постов',
      'Генератор виджета',
      'Аналитика профиля',
    ],
    monthly: 990,
    yearly: 9900,
  },
  premium: {
    name: 'Premium',
    features: [
      'Продвижение постов в ленте',
      'До 4 баннеров/неделю на каждую страницу',
      'Баннеры Панорама и Мини',
      'Метка «Рекомендовано»',
      'Максимальный приоритет в каталогах',
      'Значок PREMIUM',
      'Рекламные посты на профиле',
      'Конструктор постов',
      'Генератор виджета',
      'Аналитика профиля',
      'Скидки от МебПортал',
    ],
    monthly: 1490,
    yearly: 14900,
  },
};

function formatPrice(n: number) { return n.toLocaleString('ru-RU') + ' ₽'; }

export default function TariffsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [subscribing, setSubscribing] = useState(false);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal });
      const me = await meRes.json();
      if (me.user?.role === 'CLIENT') { router.push('/dashboard'); return; }

      const subRes = await fetch('/api/subscription', { headers: { Authorization: `Bearer ${token}` }, signal });
      const subData = await subRes.json();
      setSubscription(subData.subscription || null);
    } catch {
      toast.error('Ошибка загрузки');
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

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
      toast.success('Заявка отправлена! Администратор активирует подписку.');
      loadData();
    } catch { toast.error('Ошибка сети'); }
    finally { setSubscribing(false); }
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
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Тарифы</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Выберите план для продвижения вашего контента</p>

          {/* Баннер бесплатного периода */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-5 mb-8 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold">Бесплатно до 30 сентября 2026 года</h2>
                <p className="text-green-100 text-sm mt-0.5">Все функции продвижения доступны бесплатно до окончания бесплатного периода</p>
              </div>
            </div>
          </div>

          {/* Текущая подписка */}
          {subscription && (
            <div className={`rounded-xl p-5 mb-6 border ${isActive ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : isPending ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-gray-100">
                    {isActive ? 'Подписка активна' : isPending ? 'Заявка ожидает подтверждения' : 'Подписка неактивна'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    План: <span className="font-semibold">{PLANS[subscription.plan as keyof typeof PLANS]?.name || subscription.plan}</span>
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

          {/* Переключатель периода */}
          {!subscription && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                <button onClick={() => setBillingPeriod('monthly')} className={`px-5 py-2 rounded-md text-sm font-medium transition ${billingPeriod === 'monthly' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  Ежемесячно
                </button>
                <button onClick={() => setBillingPeriod('yearly')} className={`px-5 py-2 rounded-md text-sm font-medium transition ${billingPeriod === 'yearly' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  Ежегодно <span className="text-green-600 text-xs">-17%</span>
                </button>
              </div>
            </div>
          )}

          {/* Карточки планов */}
          {!subscription && (
            <div className="grid md:grid-cols-3 gap-5 mb-8">
              {(Object.entries(PLANS) as [string, typeof PLANS.lite][]).map(([key, plan]) => {
                const price = billingPeriod === 'monthly' ? plan.monthly : plan.yearly;
                const perMonth = billingPeriod === 'yearly' ? Math.round(plan.yearly / 12) : plan.monthly;
                const isPro = key === 'pro';
                const isPremium = key === 'premium';
                return (
                  <div key={key} className={`rounded-2xl border-2 p-5 ${isPremium ? 'relative border-amber-400 shadow-lg shadow-amber-100' : isPro ? 'relative border-brand-500 shadow-lg shadow-brand-100' : 'border-gray-200 dark:border-gray-700'}`}>
                    {isPro && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">Популярный</div>}
                    {isPremium && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">Лучший</div>}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{plan.name}</h3>
                    <div className="mb-5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-green-600">Бесплатно</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm text-gray-400 dark:text-gray-500 line-through">{formatPrice(price)}</span>
                        <span className="text-gray-400 dark:text-gray-500 text-sm">/{billingPeriod === 'monthly' ? 'мес' : 'год'}</span>
                      </div>
                      {billingPeriod === 'yearly' && <p className="text-sm text-gray-400 line-through mt-0.5">{formatPrice(perMonth)}/мес</p>}
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                          <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleSubscribe(key)}
                      disabled={subscribing}
                      className={`w-full py-3 rounded-xl font-medium transition ${isPremium ? 'bg-amber-500 text-white hover:bg-amber-600' : isPro ? 'bg-brand-500 text-white hover:bg-brand-600' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                    >
                      {subscribing ? 'Отправка...' : 'Оформить'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Сравнение */}
          {!subscription && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
              <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Сравнение тарифов</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-3 text-gray-500 dark:text-gray-400 font-medium">Возможность</th>
                    <th className="text-center py-3 font-medium">Lite</th>
                    <th className="text-center py-3 font-medium text-brand-600">Pro</th>
                    <th className="text-center py-3 font-medium text-amber-600">Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { feature: 'Продвижение постов', lite: true, pro: true, premium: true },
                    { feature: 'Баннеры', lite: '1 шт./стр.', pro: '2 шт./нед. на стр.', premium: '4 шт./нед. на стр.' },
                    { feature: 'Метка «Рекомендовано»', lite: true, pro: true, premium: true },
                    { feature: 'Приоритет в каталогах', lite: false, pro: true, premium: true },
                    { feature: 'Значок', lite: false, pro: 'PRO', premium: 'PREMIUM' },
                    { feature: 'Рекламные посты на профиле', lite: false, pro: false, premium: true },
                    { feature: 'Аналитика профиля', lite: false, pro: false, premium: true },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="py-3 text-gray-700 dark:text-gray-300">{row.feature}</td>
                      <td className="py-3 text-center">
                        {typeof row.lite === 'boolean' ? (
                          row.lite ? <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            : <span className="text-gray-300 dark:text-gray-600">—</span>
                        ) : <span className="text-gray-700 dark:text-gray-300">{row.lite}</span>}
                      </td>
                      <td className="py-3 text-center">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            : <span className="text-gray-300 dark:text-gray-600">—</span>
                        ) : <span className="text-brand-600 font-medium">{row.pro}</span>}
                      </td>
                      <td className="py-3 text-center">
                        {typeof row.premium === 'boolean' ? (
                          row.premium ? <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            : <span className="text-gray-300 dark:text-gray-600">—</span>
                        ) : <span className="text-amber-600 font-medium">{row.premium}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Оплата */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Оплата</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Сейчас все функции доступны <span className="text-green-600 font-medium">бесплатно</span>. После 30 сентября 2026 года для оплаты подписки свяжитесь с нами по телефону.
            </p>
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
