export interface Promo {
  key: string;
  title: string;
  description: string;
  icon: string;
  reward: string;
  conditions: string[];
  type: 'auto' | 'manual';
  permanent: boolean;
  startDate?: string;
  endDate?: string;
  color: string;
}

export const PROMOS: Promo[] = [
  {
    key: 'widget_discount',
    title: 'Скидка за Виджет',
    description: 'Разместите виджет МебПортала на своём сайте и получите скидку на подписку.',
    icon: '🔌',
    reward: 'Скидка 15% на любую подписку',
    conditions: [
      'Установите виджет на свой сайт',
      'Загрузите скриншот с виджетом',
      'Укажите ссылку на сайт',
      'Администратор проверит и начислит скидку',
    ],
    type: 'manual',
    permanent: true,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    key: 'referral_program',
    title: 'Реферальная программа',
    description: 'Пригласите коллег на платформу и получите PRO-подписку.',
    icon: '👥',
    reward: '1 месяц PRO бесплатно',
    conditions: [
      'Поделитесь реферальной ссылкой',
      '3 коллеги должны зарегистрироваться',
      'Награда начисляется автоматически',
    ],
    type: 'auto',
    permanent: true,
    color: 'from-purple-500 to-pink-500',
  },
  {
    key: 'profile_100',
    title: 'Заполни профиль',
    description: 'Полностью заполните профиль и получите бейдж + кредит на продвижение.',
    icon: '✅',
    reward: 'Бейдж "Проверенный" + кредит 500₽',
    conditions: [
      'Загрузите фото профиля',
      'Добавьте обложку',
      'Напишите описание',
      'Укажите город и сайт',
      'Добавьте ссылки на соцсети',
    ],
    type: 'auto',
    permanent: true,
    color: 'from-green-500 to-emerald-500',
  },
  {
    key: 'active_author',
    title: 'Активный автор',
    description: 'Публикуйте посты активно и получайте бесплатные баннеры.',
    icon: '✍️',
    reward: '1 бесплатный баннер',
    conditions: [
      'Опубликуйте 10 постов за месяц',
      'Посты должны быть уникальными',
      'Награда начисляется автоматически',
    ],
    type: 'auto',
    permanent: true,
    color: 'from-amber-500 to-orange-500',
  },
  {
    key: 'reviews_reward',
    title: 'Отзывы в награду',
    description: 'Пишите отзывы о коллегах и получайте Premium-подписку.',
    icon: '⭐',
    reward: '1 месяц Premium бесплатно',
    conditions: [
      'Оставьте 5 отзывов другим пользователям',
      'Отзывы должны быть одобрены',
      'Награда начисляется автоматически',
    ],
    type: 'auto',
    permanent: true,
    color: 'from-yellow-500 to-amber-500',
  },
  {
    key: 'first_post',
    title: 'Первый пост',
    description: 'Опубликуйте свой первый пост и получите бесплатное продвижение.',
    icon: '🎉',
    reward: 'Бесплатное продвижение первого поста на 7 дней',
    conditions: [
      'Опубликуйте первый пост на платформе',
      'Продвижение активируется автоматически',
      'Действует для новых пользователей (первые 30 дней)',
    ],
    type: 'auto',
    permanent: true,
    color: 'from-rose-500 to-pink-500',
  },
  {
    key: 'summer_2026',
    title: 'Лето с МебПорталом',
    description: 'Скидка на Premium-подписку в летний период.',
    icon: '☀️',
    reward: 'Скидка 20% на Premium',
    conditions: [
      'Оформите Premium до конца августа',
      'Скидка применяется автоматически',
    ],
    type: 'auto',
    permanent: false,
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    color: 'from-orange-400 to-yellow-400',
  },
  {
    key: 'autumn_business_2026',
    title: 'Осень для бизнеса',
    description: 'Два баннера по цене одного осенью.',
    icon: '🍂',
    reward: '2 баннера по цене 1',
    conditions: [
      'Оформите подписку Pro или Premium',
      'Два баннера в течение акции',
      'Автоматическое начисление',
    ],
    type: 'auto',
    permanent: false,
    startDate: '2026-09-01',
    endDate: '2026-11-30',
    color: 'from-orange-600 to-red-500',
  },
  {
    key: 'newyear_2027',
    title: 'Новогодний подарок',
    description: 'Оплатите год и получите месяц Premium в подарок.',
    icon: '🎄',
    reward: '1 месяц Premium при оплате года',
    conditions: [
      'Оформите годовую подписку',
      'Получите дополнительный месяц бесплатно',
    ],
    type: 'auto',
    permanent: false,
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    color: 'from-red-500 to-green-500',
  },
  {
    key: 'spring_2027',
    title: 'Весеннее обновление',
    description: 'Бесплатный виджет для всех участников.',
    icon: '🌸',
    reward: 'Бесплатный виджет на 3 месяца',
    conditions: [
      'Заявка автоматически одобряется',
      'Виджет доступен всем',
    ],
    type: 'auto',
    permanent: false,
    startDate: '2027-03-01',
    endDate: '2027-05-31',
    color: 'from-pink-400 to-rose-400',
  },
];

export function getActivePromos(): Promo[] {
  const now = new Date();
  return PROMOS.filter(p => {
    if (p.permanent) return true;
    if (p.startDate && p.endDate) {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      return now >= start && now <= end;
    }
    return true;
  });
}

export function getPromoByKey(key: string): Promo | undefined {
  return PROMOS.find(p => p.key === key);
}
