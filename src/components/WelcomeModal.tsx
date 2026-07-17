'use client';

import { useState, useEffect } from 'react';

const roleContent: Record<string, { emoji: string; title: string; text: string; features: string[] }> = {
  ADMIN: {
    emoji: '👑',
    title: 'Добро пожаловать, Администратор!',
    text: 'Полный доступ ко всем настройкам платформы.',
    features: ['Управление пользователями и модерация', 'Настройка контента и разделов', 'Просмотр статистики и аналитика'],
  },
  USER: {
    emoji: '✦',
    title: 'Добро пожаловать на МебПортал!',
    text: 'Платформа для профессионалов мебельной отрасли.',
    features: ['Создавайте публикации и делитесь работами', 'Добавляйте товары в каталог', 'Общайтесь с коллегами в группах'],
  },
  COMPANY: {
    emoji: '◆',
    title: 'Добро пожаловать!',
    text: 'Ваша компания теперь на МебПортале.',
    features: ['Заполните профиль компании', 'Добавьте товары и портфолио', 'Найдите поставщиков для сотрудничества'],
  },
  SUPPLIER: {
    emoji: '●',
    title: 'Добро пожаловать!',
    text: 'Ваш профиль поставщика готов.',
    features: ['Добавляйте прайс-листы и каталог', 'Размещайте информацию о продукции', 'Находите новых клиентов'],
  },
  MANUFACTURER: {
    emoji: '■',
    title: 'Добро пожаловать!',
    text: 'Производство зарегистрировано на платформе.',
    features: ['Представьте ваше производство', 'Разместите каталог продукции', 'Наладите контакты с поставщиками'],
  },
  CLIENT: {
    emoji: '○',
    title: 'Добро пожаловать!',
    text: 'Просматривайте каталог и находите поставщиков.',
    features: ['Скачивайте документы и справочники', 'Просматривайте изображения мебели', 'Находите нужных поставщиков'],
  },
};

const defaultContent = {
  emoji: '👋',
  title: 'Добро пожаловать!',
  text: 'Платформа для профессионалов мебельной отрасли.',
  features: ['Просматривайте каталог изображений', 'Скачивайте документы и справочники', 'Находите поставщиков мебели'],
};

export default function WelcomeModal() {
  const [show, setShow] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        const userRole = data?.user?.role;
        if (!userRole) return;

        const seen = localStorage.getItem(`welcome_seen_${userRole}`);
        if (!seen) {
          setRole(userRole);
          setShow(true);
        }
      })
      .catch(() => {});
  }, []);

  const close = () => {
    if (role) {
      localStorage.setItem(`welcome_seen_${role}`, '1');
    }
    setShow(false);
  };

  if (!show || !role) return null;

  const content = roleContent[role] || defaultContent;

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={close}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-orange-500 text-3xl mb-4 shadow-lg">
            {content.emoji}
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{content.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{content.text}</p>
        </div>

        <ul className="space-y-3 mb-6">
          {content.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-brand-500 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {feature}
            </li>
          ))}
        </ul>

        <button
          onClick={close}
          className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors duration-200 active:scale-[0.98]"
        >
          Понятно, начать!
        </button>
      </div>
    </div>
  );
}
