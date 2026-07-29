'use client';

import OverlayOnboarding, { type OnboardingStep } from './OverlayOnboarding';

const steps: OnboardingStep[] = [
  {
    target: '[data-onboarding="avatar"]',
    title: 'Ваш профиль',
    description: 'Это ваша страница. Здесь вас видят другие пользователи. Аватар и имя — первое, что замечают. Редактировать можно в настройках профиля.',
    position: 'bottom',
  },
  {
    target: '[data-onboarding="analytics"]',
    title: 'Аналитика',
    description: 'Здесь отображается статистика вашего профиля: просмотры, лайки, активность за неделю и месяц. Следите за ростом!',
    position: 'bottom',
  },
  {
    target: '[data-onboarding="tabs"]',
    title: 'Вкладки',
    description: 'Переключайтесь между публикациями, портфолио, отзывами и информацией о себе. Каждый раздел помогает раскрыть ваш профессионализм.',
    position: 'bottom',
  },
  {
    target: '[data-onboarding="stats"]',
    title: 'Статистика',
    description: 'Количество постов, работ в портфолио, подписчиков и подписок. Высокие показатели повышают доверие клиентов.',
    position: 'top',
  },
  {
    target: '[data-onboarding="actions"]',
    title: 'Быстрые действия',
    description: 'Редактируйте профиль, добавляйте работы в портфолио или создавайте посты прямо отсюда. Всё под рукой!',
    position: 'top',
  },
];

interface ProfileOnboardingProps {
  force?: boolean;
}

export default function ProfileOnboarding({ force = false }: ProfileOnboardingProps) {
  return <OverlayOnboarding steps={steps} storageKey="profile_onboarding_done" force={force} accentColor="emerald" />;
}
