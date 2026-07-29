'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
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
    icon: '⚡',
    color: 'from-blue-500 to-cyan-500',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-500',
    btn: 'bg-blue-600 hover:bg-blue-700',
    features: [
      'Продвижение постов в ленте',
      '1 баннер на каждую страницу',
      'Метка «Рекомендовано»',
      'Конструктор постов',
    ],
    monthly: 490,
    yearly: 4900,
  },
  pro: {
    name: 'Pro',
    icon: '🚀',
    color: 'from-brand-500 to-orange-500',
    border: 'border-brand-300 dark:border-brand-700',
    badge: 'bg-brand-500',
    btn: 'bg-brand-500 hover:bg-brand-600',
    features: [
      'Всё из Lite',
      'До 2 баннеров/неделю на страницу',
      'Баннеры Панорама и Мини',
      'Приоритет в каталогах',
      'Значок PRO на профиле',
      'Генератор виджета',
      'Аналитика профиля',
    ],
    monthly: 990,
    yearly: 9900,
  },
  premium: {
    name: 'Premium',
    icon: '👑',
    color: 'from-amber-500 to-yellow-500',
    border: 'border-amber-300 dark:border-amber-700',
    badge: 'bg-amber-500',
    btn: 'bg-amber-500 hover:bg-amber-600',
    features: [
      'Всё из Pro',
      'До 4 баннеров/неделю на страницу',
      'Максимальный приоритет в каталогах',
      'Значок PREMIUM',
      'Рекламные посты на профиле',
      'Интеграция с AmoCRM',
      'Поднятие товаров за клики',
      'Новостная рассылка',
      'Скидки от МебПортал',
    ],
    monthly: 1490,
    yearly: 14900,
  },
};

const COMPARISON: { category: string; icon: string; rows: { feature: string; free: string | boolean; lite: string | boolean; pro: string | boolean; premium: string | boolean }[] }[] = [
  {
    category: 'Контент',
    icon: '📝',
    rows: [
      { feature: 'Создание постов', free: true, lite: true, pro: true, premium: true },
      { feature: 'Портфолио', free: 'до 10 работ', lite: 'до 30 работ', pro: 'до 100 работ', premium: 'безлимит' },
      { feature: 'Конструктор постов', free: false, lite: true, pro: true, premium: true },
      { feature: 'Генератор виджета', free: false, lite: false, pro: true, premium: true },
      { feature: 'Рекламные посты на профиле', free: false, lite: false, pro: false, premium: true },
      { feature: 'Новостная рассылка', free: false, lite: false, pro: false, premium: true },
    ],
  },
  {
    category: 'Продвижение',
    icon: '📢',
    rows: [
      { feature: 'Продвижение постов в ленте', free: false, lite: true, pro: true, premium: true },
      { feature: 'Метка «Рекомендовано»', free: false, lite: true, pro: true, premium: true },
      { feature: 'Приоритет в каталогах', free: false, lite: false, pro: true, premium: true },
      { feature: 'Максимальный приоритет', free: false, lite: false, pro: false, premium: true },
      { feature: 'Поднятие товаров за клики', free: false, lite: false, pro: false, premium: true },
    ],
  },
  {
    category: 'Баннеры',
    icon: '🖼',
    rows: [
      { feature: 'Баннеры на страницах', free: false, lite: '1 шт./стр.', pro: '2 шт./нед.', premium: '4 шт./нед.' },
      { feature: 'Типы баннеров', free: false, lite: 'Стандарт', pro: '+ Панорама, Мини', premium: '+ Панорама, Мини' },
    ],
  },
  {
    category: 'Аналитика',
    icon: '📊',
    rows: [
      { feature: 'Аналитика профиля', free: false, lite: false, pro: true, premium: true },
      { feature: 'Статистика просмотров', free: false, lite: false, pro: true, premium: true },
    ],
  },
  {
    category: 'Интеграции',
    icon: '🔗',
    rows: [
      { feature: 'Интеграция с AmoCRM', free: false, lite: false, pro: false, premium: true },
    ],
  },
  {
    category: 'Эксклюзивы',
    icon: '⭐',
    rows: [
      { feature: 'Значок на профиле', free: false, lite: false, pro: 'PRO', premium: 'PREMIUM' },
      { feature: 'Скидки от МебПортал', free: false, lite: false, pro: false, premium: true },
    ],
  },
];

const FAQ = [
  { q: 'Как оформить подписку?', a: 'Выберите подходящий тариф и нажмите «Оформить». Заявка отправится администратору, который активирует подписку в течение 24 часов.' },
  { q: 'Можно ли сменить тариф?', a: 'Да, вы можете сменить тариф в любой момент. Стоимость будет пересчитана пропорционально оставшемуся периоду.' },
  { q: 'Что происходит после бесплатного периода?', a: 'После 25 ноября 2026 года для продолжения использования функций продвижения необходимо оформить подписку. Базовые функции (создание постов, портфолио) останутся бесплатными.' },
  { q: 'Как оплатить подписку?', a: 'Сейчас все функции бесплатны. После окончания бесплатного периода оплата будет доступна через личный кабинет или по телефону.' },
  { q: 'Можно ли отменить подписку?', a: 'Да, вы можете отменить заявку до её подтверждения. После активации подписки обратитесь в поддержку.' },
  { q: 'Что входит в бесплатный тариф?', a: 'Бесплатный тариф включает создание постов, портфолио (до 10 работ), базовый профиль и отзывы. Функции продвижения и баннеры доступны только на платных тарифах.' },
];

function formatPrice(n: number) { return n.toLocaleString('ru-RU') + ' ₽'; }

function daysUntil(target: Date) {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function CellValue({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (typeof value === 'boolean') {
    return value
      ? <svg className={`w-5 h-5 ${highlight ? 'text-green-600' : 'text-green-500'} mx-auto`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
      : <span className="text-gray-300 dark:text-gray-600">—</span>;
  }
  return <span className={`text-xs font-medium ${highlight ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>{value}</span>;
}

export default function TariffsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [subscribing, setSubscribing] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
    if (plan === 'free') { toast('Бесплатный тариф уже активен'); return; }
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
  const daysLeft = daysUntil(new Date('2026-11-25'));

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pb-4 md:pb-8 w-full min-w-0">
        <div className="max-w-4xl">

          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 p-6 md:p-8 mb-8 text-white">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 rounded-full p-1.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                <span className="text-sm font-medium text-green-100">Бесплатный период</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Все функции бесплатны до 25 ноября 2026</h1>
              <p className="text-green-100 mb-4">Попробуйте все возможности продвижения без ограничений</p>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                  <div className="text-2xl font-bold">{daysLeft}</div>
                  <div className="text-xs text-green-100">дней осталось</div>
                </div>
                <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
                  <div className="text-2xl font-bold">0 ₽</div>
                  <div className="text-xs text-green-100">сейчас</div>
                </div>
              </div>
            </div>
          </div>

          {/* Текущая подписка */}
          {subscription && (
            <div className={`rounded-xl p-4 mb-6 border ${isActive ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : isPending ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold text-white mb-1 ${isActive ? 'bg-green-500' : isPending ? 'bg-yellow-500' : 'bg-gray-400'}`}>
                    {isActive ? 'Активна' : isPending ? 'Ожидает' : 'Неактивна'}
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    План: <span className="font-semibold">{PLANS[subscription.plan as keyof typeof PLANS]?.name || subscription.plan}</span>
                    {' · '}
                    {subscription.period === 'monthly' ? 'Ежемесячная' : 'Ежегодная'}
                    {subscription.endDate && isActive && <> · До {new Date(subscription.endDate).toLocaleDateString('ru-RU')}</>}
                  </p>
                </div>
                {isPending && (
                  <button onClick={handleCancelSubscription} className="text-red-600 hover:text-red-700 text-sm font-medium px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition">
                    Отменить заявку
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Переключатель периода */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
              <button onClick={() => setBillingPeriod('monthly')} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${billingPeriod === 'monthly' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                Ежемесячно
              </button>
              <button onClick={() => setBillingPeriod('yearly')} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${billingPeriod === 'yearly' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                Ежегодно <span className="text-green-600 font-bold">-17%</span>
              </button>
            </div>
          </div>

          {/* Карточки планов */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {/* Бесплатный */}
            <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-4 flex flex-col bg-white dark:bg-gray-800">
              <div className="text-2xl mb-2">🆓</div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Бесплатный</h3>
              <div className="mb-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">0 ₽</div>
                <div className="text-xs text-gray-400">навсегда</div>
              </div>
              <ul className="space-y-2 mb-4 flex-1">
                {['Создание постов', 'Портфолио (до 10 работ)', 'Базовый профиль', 'Отзывы'].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="w-full py-2.5 rounded-xl text-center text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                Текущий
              </div>
            </div>

            {/* Lite / Pro / Premium */}
            {(Object.entries(PLANS) as [string, typeof PLANS.lite][]).map(([key, plan]) => {
              const price = billingPeriod === 'monthly' ? plan.monthly : plan.yearly;
              const perMonth = billingPeriod === 'yearly' ? Math.round(plan.yearly / 12) : plan.monthly;
              const isPro = key === 'pro';
              const isPremium = key === 'premium';
              const isCurrent = isActive && subscription?.plan === key;
              return (
                <div key={key} className={`rounded-2xl border-2 p-4 flex flex-col relative transition-all hover:shadow-lg ${isCurrent ? 'border-green-500 shadow-lg shadow-green-100 dark:shadow-green-900/30' : isPro ? 'border-brand-400 dark:border-brand-600 shadow-md shadow-brand-100 dark:shadow-brand-900/20 scale-[1.02]' : plan.border}`}>
                  {isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">Ваш план</div>}
                  {!isCurrent && isPro && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">Популярный</div>}
                  {!isCurrent && isPremium && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">Лучший</div>}
                  <div className="text-2xl mb-2">{plan.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{plan.name}</h3>
                  <div className="mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-green-600">Бесплатно</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xs text-gray-400 line-through">{formatPrice(price)}</span>
                      <span className="text-xs text-gray-400">/{billingPeriod === 'monthly' ? 'мес' : 'год'}</span>
                    </div>
                    {billingPeriod === 'yearly' && (
                      <p className="text-[10px] text-green-500 font-medium mt-0.5">Экономия {formatPrice(plan.monthly * 12 - plan.yearly)}/год</p>
                    )}
                  </div>
                  <ul className="space-y-1.5 mb-4 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                        <svg className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl text-center text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      Текущий план
                    </div>
                  ) : (
                    <button onClick={() => handleSubscribe(key)} disabled={subscribing} className={`w-full py-2.5 rounded-xl text-sm font-medium text-white transition ${plan.btn}`}>
                      {subscribing ? '...' : isActive ? 'Сменить' : 'Оформить'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Для кого */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
            {[
              { icon: '🆓', title: 'Бесплатный', desc: 'Для знакомства с платформой', color: 'bg-gray-50 dark:bg-gray-800' },
              { icon: '⚡', title: 'Lite', desc: 'Для начинающих: первые шаги в продвижении', color: 'bg-blue-50 dark:bg-blue-900/20' },
              { icon: '🚀', title: 'Pro', desc: 'Для активных: максимум видимости в каталогах', color: 'bg-brand-50 dark:bg-brand-900/20' },
              { icon: '👑', title: 'Premium', desc: 'Для профессионалов: все инструменты + эксклюзивы', color: 'bg-amber-50 dark:bg-amber-900/20' },
            ].map(item => (
              <div key={item.title} className={`${item.color} rounded-xl p-4 text-center`}>
                <div className="text-2xl mb-1">{item.icon}</div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-0.5">{item.title}</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Таблица сравнения */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden mb-10">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Сравнение тарифов</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium w-1/3">Возможность</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-500">Бесплатный</th>
                    <th className="text-center py-3 px-2 font-medium text-blue-600">Lite</th>
                    <th className="text-center py-3 px-2 font-medium text-brand-600">Pro</th>
                    <th className="text-center py-3 px-2 font-medium text-amber-600">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((group, gi) => (
                    <Fragment key={gi}>
                      <tr className="bg-gray-50 dark:bg-gray-900/50">
                        <td colSpan={5} className="py-2 px-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <span className="mr-1.5">{group.icon}</span>{group.category}
                        </td>
                      </tr>
                      {group.rows.map((row, ri) => (
                        <tr key={ri} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                          <td className="py-2.5 px-4 text-gray-700 dark:text-gray-300 text-xs">{row.feature}</td>
                          <td className="py-2.5 px-2 text-center"><CellValue value={row.free} /></td>
                          <td className="py-2.5 px-2 text-center"><CellValue value={row.lite} /></td>
                          <td className="py-2.5 px-2 text-center"><CellValue value={row.pro} /></td>
                          <td className="py-2.5 px-2 text-center"><CellValue value={row.premium} highlight={subscription?.plan === 'premium'} /></td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">Частые вопросы</h2>
            <div className="space-y-2">
              {FAQ.map((item, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100 pr-4">{item.q}</span>
                    <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Оплата + помощь */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Оплата</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                Сейчас все функции доступны <span className="text-green-600 font-medium">бесплатно</span>. После 25 ноября 2026 для оплаты свяжитесь с нами.
              </p>
              <a href="tel:+79001234567" className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-600 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                Позвонить
              </a>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Нужна помощь?</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                Ответы на вопросы о тарифах, подписке и возможностях платформы.
              </p>
              <a href="/help" className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                Центр помощи
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
