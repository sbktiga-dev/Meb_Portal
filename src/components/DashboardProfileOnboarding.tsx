'use client';

import OverlayOnboarding, { type OnboardingStep } from './OverlayOnboarding';

const steps: OnboardingStep[] = [
  {
    target: '[data-onboarding="avatar"]',
    title: 'Фото профиля',
    description: 'Нажмите на аватар, чтобы загрузить фото. Профессиональное фото увеличивает доверие клиентов и количество просмотров профиля.',
    position: 'bottom',
  },
  {
    target: '[data-onboarding="name"]',
    title: 'Имя и контакты',
    description: 'Укажите имя, телефон и ИНН. Имя отображается в поиске и на вашей странице. Телефон видят только подписчики.',
    position: 'bottom',
  },
  {
    target: '[data-onboarding="bio"]',
    title: 'О себе',
    description: 'Расскажите о своём опыте и специализации. Хорошее описание помогает клиентам принять решение о сотрудничестве.',
    position: 'top',
  },
  {
    target: '[data-onboarding="socials"]',
    title: 'Социальные сети',
    description: 'Добавьте ссылки на Telegram, WhatsApp, VK. Клиенты смогут связаться с вами удобным способом.',
    position: 'top',
  },
  {
    target: '[data-onboarding="theme"]',
    title: 'Тема оформления',
    description: 'Выберите цветовую тему для вашей страницы. Уникальное оформление выделяет вас среди других специалистов.',
    position: 'top',
  },
  {
    target: '[data-onboarding="banners"]',
    title: 'Рекламные баннеры',
    description: 'Добавьте баннеры на страницу профиля. Используйте их для акций, портфолио или важных объявлений.',
    position: 'top',
  },
  {
    target: '[data-onboarding="save"]',
    title: 'Сохранение',
    description: 'После заполнения всех полей нажмите «Сохранить изменения». Изменения сразу отобразятся на вашей странице.',
    position: 'top',
  },
];

interface DashboardProfileOnboardingProps {
  force?: boolean;
}

export default function DashboardProfileOnboarding({ force = false }: DashboardProfileOnboardingProps) {
  return <OverlayOnboarding steps={steps} storageKey="dashboard_profile_onboarding_done" force={force} accentColor="amber" />;
}
