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
    features: ['Продвижение постов в ленте', '1 баннер в ленте или каталоге', 'Метка «Рекомендовано»'],
    monthly: 1500,
    yearly: 15000,
  },
  pro: {
    name: 'Pro',
    features: ['Продвижение постов в ленте', 'До 2 баннеров в неделю', 'Метка «Рекомендовано»', 'Приоритет в результатах поиска'],
    monthly: 4000,
    yearly: 40000,
  },
};

function formatPrice(n: number) { return n.toLocaleString('ru-RU') + ' ₽'; }

export default function TariffsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [subscribing, setSubscribing] = useState(false);

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      const me = await meRes.json();
      if (me.user?.role === 'CLIENT') { router.push('/dashboard'); return; }

      const subRes = await fetch('/api/subscription', { headers: { Authorization: `Bearer ${token}` } });
      const subData = await subRes.json();
      setSubscription(subData.subscription || null);
    } catch {
      toast.error('Ошибка загрузки');
    } finally { setLoading(false); }
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Тарифы</h1>
          <p className="text-gray-500 mb-8">Выберите план для продвижения вашего контента</p>

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

          {/* Переключатель периода */}
          {!subscription && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setBillingPeriod('monthly')} className={`px-5 py-2 rounded-md text-sm font-medium transition ${billingPeriod === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                  Ежемесячно
                </button>
                <button onClick={() => setBillingPeriod('yearly')} className={`px-5 py-2 rounded-md text-sm font-medium transition ${billingPeriod === 'yearly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                  Ежегодно <span className="text-green-600 text-xs">-17%</span>
                </button>
              </div>
            </div>
          )}

          {/* Карточки планов */}
          {!subscription && (
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {(Object.entries(PLANS) as [string, typeof PLANS.lite][]).map(([key, plan]) => {
                const price = billingPeriod === 'monthly' ? plan.monthly : plan.yearly;
                const perMonth = billingPeriod === 'yearly' ? Math.round(plan.yearly / 12) : plan.monthly;
                const isLite = key === 'lite';
                return (
                  <div key={key} className={`rounded-2xl border-2 p-6 ${!isLite ? 'relative border-brand-500 shadow-lg shadow-brand-100' : 'border-gray-200'}`}>
                    {!isLite && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">Популярный</div>}
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                    <div className="mb-5">
                      <span className="text-3xl font-bold text-gray-900">{formatPrice(price)}</span>
                      <span className="text-gray-500 text-sm">/{billingPeriod === 'monthly' ? 'мес' : 'год'}</span>
                      {billingPeriod === 'yearly' && <p className="text-sm text-green-600 mt-1">{formatPrice(perMonth)}/мес</p>}
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handleSubscribe(key)}
                      disabled={subscribing}
                      className={`w-full py-3 rounded-xl font-medium transition ${isLite ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-brand-500 text-white hover:bg-brand-600'}`}
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
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="font-bold text-gray-900 mb-4">Сравнение тарифов</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 text-gray-500 font-medium">Возможность</th>
                    <th className="text-center py-3 font-medium">Lite</th>
                    <th className="text-center py-3 font-medium text-brand-600">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { feature: 'Продвижение постов', lite: true, pro: true },
                    { feature: 'Баннеры', lite: '1 шт.', pro: '2 шт./нед.' },
                    { feature: 'Метка «Рекомендовано»', lite: true, pro: true },
                    { feature: 'Приоритет в поиске', lite: false, pro: true },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="py-3 text-gray-700">{row.feature}</td>
                      <td className="py-3 text-center">
                        {typeof row.lite === 'boolean' ? (
                          row.lite ? <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            : <span className="text-gray-300">—</span>
                        ) : <span className="text-gray-700">{row.lite}</span>}
                      </td>
                      <td className="py-3 text-center">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? <svg className="w-5 h-5 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            : <span className="text-gray-300">—</span>
                        ) : <span className="text-brand-600 font-medium">{row.pro}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Оплата */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Оплата</h2>
            <p className="text-gray-500 text-sm mb-4">Для оплаты подписки свяжитесь с нами по телефону. Администратор активирует подписку в течение 24 часов.</p>
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
