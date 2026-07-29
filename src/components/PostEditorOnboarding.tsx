'use client';

import OverlayOnboarding, { type OnboardingStep } from './OverlayOnboarding';

const steps: OnboardingStep[] = [
  {
    target: '[data-onboarding="category"]',
    title: 'Категория поста',
    description: 'Выберите тип публикации: новость, проект, статья или товар. Это поможет другим пользователям найти ваш пост.',
    position: 'bottom',
  },
  {
    target: '[data-onboarding="title"]',
    title: 'Заголовок',
    description: 'Напишите короткий и понятный заголовок. Он будет виден в ленте и привлечёт внимание читателей.',
    position: 'bottom',
  },
  {
    target: '[data-onboarding="content"]',
    title: 'Текст поста',
    description: 'Добавьте основное содержание. Расскажите о своём проекте, продукте или новости подробнее.',
    position: 'top',
  },
  {
    target: '[data-onboarding="media"]',
    title: 'Фото и видео',
    description: 'Загрузите изображения или видео. Публикации с медиа получают в 3 раза больше просмотров!',
    position: 'top',
  },
  {
    target: '[data-onboarding="publish"]',
    title: 'Публикация',
    description: 'Когда всё готово — нажмите «Опубликовать». Пост сразу появится в ленте для всех пользователей.',
    position: 'top',
  },
];

interface PostEditorOnboardingProps {
  force?: boolean;
}

export default function PostEditorOnboarding({ force = false }: PostEditorOnboardingProps) {
  return <OverlayOnboarding steps={steps} storageKey="post_editor_onboarding_done" force={force} />;
}
