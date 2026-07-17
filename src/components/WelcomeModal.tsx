'use client';

import { useState, useEffect } from 'react';

interface TourStep {
  emoji: string;
  title: string;
  text: string;
  features: string[];
  color: string;
}

const roleTour: Record<string, TourStep[]> = {
  ADMIN: [
    { emoji: '👑', title: 'Добро пожаловать, Администратор!', text: 'Полный доступ ко всем настройкам платформы.', features: [], color: 'from-red-500 to-orange-500' },
    { emoji: '👥', title: 'Управление пользователями', text: 'Просматривайте профили, меняйте роли, блокируйте нарушителей.', features: ['Просмотр всех пользователей', 'Изменение ролей', 'Блокировка аккаунтов', 'Модерация контента'], color: 'from-blue-500 to-cyan-500' },
    { emoji: '📊', title: 'Статистика и аналитика', text: 'Отслеживайте активность платформы в реальном времени.', features: ['Количество пользователей', 'Статистика постов и загрузок', 'Графики регистраций', 'Популярный контент'], color: 'from-green-500 to-emerald-500' },
    { emoji: '🚀', title: 'Продвижение и акции', text: 'Управляйте рекламными заявками и акциями платформы.', features: ['Одобрение баннеров', 'Проверка заявок на акции', 'Управление подписками'], color: 'from-purple-500 to-pink-500' },
  ],
  USER: [
    { emoji: '✦', title: 'Добро пожаловать на МебПортал!', text: 'Платформа для профессионалов мебельной отрасли.', features: [], color: 'from-brand-500 to-orange-500' },
    { emoji: '📝', title: 'Публикации', text: 'Делитесь проектами, идеями и опытом с коллегами.', features: ['Создавайте посты с фото', 'Используйте конструктор', 'Добавляйте теги'], color: 'from-blue-500 to-cyan-500' },
    { emoji: '📦', title: 'Товары и портфолио', text: 'Представьте свои работы и товары.', features: ['Каталог товаров', 'Портфолио проектов', 'Отзывы клиентов'], color: 'from-emerald-500 to-teal-500' },
    { emoji: '💬', title: 'Общение', text: 'Находите коллег и общайтесь в группах.', features: ['Личные сообщения', 'Группы по интересам', 'Подписки на авторов'], color: 'from-purple-500 to-pink-500' },
    { emoji: '🎯', title: 'Продвижение', text: 'Продвигайте свои посты и баннеры.', features: ['Закрепление постов', 'Рекламные баннеры', 'Бесплатные акции'], color: 'from-amber-500 to-orange-500' },
  ],
  COMPANY: [
    { emoji: '◆', title: 'Добро пожаловать!', text: 'Ваша компания теперь на МебПортале.', features: [], color: 'from-blue-500 to-indigo-500' },
    { emoji: '🏢', title: 'Профиль компании', text: 'Представьте вашу компанию профессионалам.', features: ['Описание и логотип', 'Контакты и соцсети', 'География работы'], color: 'from-blue-500 to-cyan-500' },
    { emoji: '📦', title: 'Каталог товаров', text: 'Добавляйте товары с фото и характеристиками.', features: ['Фото товаров', 'Описание и цена', 'Категории'], color: 'from-emerald-500 to-teal-500' },
    { emoji: '🤝', title: 'Поиск партнёров', text: 'Находите поставщиков и специалистов.', features: ['Каталог поставщиков', 'Каталог специалистов', 'Личные сообщения'], color: 'from-purple-500 to-pink-500' },
  ],
  SUPPLIER: [
    { emoji: '●', title: 'Добро пожаловать!', text: 'Ваш профиль поставщика готов.', features: [], color: 'from-emerald-500 to-teal-500' },
    { emoji: '📋', title: 'Прайс-листы', text: 'Добавляйте товары с ценами и характеристиками.', features: ['Загрузка товаров', 'Цены и наличие', 'Фото продукции'], color: 'from-emerald-500 to-teal-500' },
    { emoji: '📢', title: 'Реклама', text: 'Продвигайте свою продукцию через баннеры.', features: ['Баннеры в каталоге', 'Баннеры в ленте', 'Панорамные баннеры'], color: 'from-amber-500 to-orange-500' },
    { emoji: '💼', title: 'Клиенты', text: 'Находите новых покупателей.', features: ['Просмотр профилей', 'Личные сообщения', 'Отзывы'], color: 'from-purple-500 to-pink-500' },
  ],
  MANUFACTURER: [
    { emoji: '■', title: 'Добро пожаловать!', text: 'Производство зарегистрировано на платформе.', features: [], color: 'from-amber-500 to-orange-500' },
    { emoji: '🏭', title: 'Ваше производство', text: 'Представьте производство профессионалам.', features: ['Описание производства', 'Фото цехов', 'Продукция'], color: 'from-amber-500 to-orange-500' },
    { emoji: '📦', title: 'Каталог продукции', text: 'Разместите каталог вашей продукции.', features: ['Фото товаров', 'Характеристики', 'Цены'], color: 'from-emerald-500 to-teal-500' },
    { emoji: '🤝', title: 'Контакты', text: 'Наладьте связи с поставщиками и дизайнерами.', features: ['Личные сообщения', 'Группы', 'События'], color: 'from-purple-500 to-pink-500' },
  ],
  CLIENT: [
    { emoji: '○', title: 'Добро пожаловать!', text: 'Просматривайте каталог и находите поставщиков.', features: [], color: 'from-gray-400 to-gray-600' },
    { emoji: '🖼', title: 'Каталог изображений', text: 'Тысячи фото мебели в разных стилях.', features: ['Бесплатное скачивание', 'Фильтры по стилям', 'Высокое разрешение'], color: 'from-brand-500 to-orange-500' },
    { emoji: '📄', title: 'Документы', text: 'Шаблоны, справочники, ГОСТы.', features: ['Шаблоны договоров', 'Технические таблицы', 'Нормы расхода'], color: 'from-blue-500 to-cyan-500' },
    { emoji: '🏭', title: 'Поставщики', text: 'Находите нужных поставщиков мебели.', features: ['Каталог поставщиков', 'Прайс-листы', 'Контакты'], color: 'from-emerald-500 to-teal-500' },
  ],
};

const defaultTour: TourStep[] = [
  { emoji: '👋', title: 'Добро пожаловать!', text: 'Платформа для профессионалов мебельной отрасли.', features: [], color: 'from-brand-500 to-orange-500' },
  { emoji: '🖼', title: 'Каталог изображений', text: 'Тысячи фото мебели в разных стилях.', features: ['Бесплатное скачивание', 'Фильтры по стилям', 'Высокое разрешение'], color: 'from-brand-500 to-orange-500' },
];

export default function WelcomeModal() {
  const [show, setShow] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const userRole = data?.user?.role;
        if (!userRole) return;
        const seen = localStorage.getItem(`welcome_seen_${userRole}`);
        if (!seen) { setRole(userRole); setShow(true); }
      }).catch(() => {});
  }, []);

  const close = () => {
    if (role) localStorage.setItem(`welcome_seen_${role}`, '1');
    setShow(false);
    setStep(0);
  };

  if (!show || !role) return null;
  const tour = roleTour[role] || defaultTour;
  const current = tour[step];
  const isLast = step === tour.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm" onClick={close}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full relative animate-in fade-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button onClick={close} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>

        {/* Header gradient */}
        <div className={`bg-gradient-to-r ${current.color} rounded-t-2xl p-8 text-center text-white`}>
          <div className="text-5xl mb-4">{current.emoji}</div>
          <h2 className="text-xl font-bold mb-1">{current.title}</h2>
          <p className="text-white/80 text-sm">{current.text}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {current.features.length > 0 && (
            <ul className="space-y-3 mb-6">
              {current.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-5">
            {tour.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-brand-500 w-6' : 'bg-gray-300 dark:bg-gray-600'}`} />
            ))}
          </div>

          {/* Nav buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} className="flex-1 py-3 border border-gray-200 dark:border-gray-600 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Назад
              </button>
            )}
            {isLast ? (
              <button onClick={close} className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition active:scale-[0.98]">
                Начать!
              </button>
            ) : (
              <button onClick={() => setStep(step + 1)} className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition active:scale-[0.98]">
                Далее
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
