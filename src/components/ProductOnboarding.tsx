'use client';

import OverlayOnboarding, { type OnboardingStep } from './OverlayOnboarding';

const steps: OnboardingStep[] = [
  {
    target: '.card-base:first-of-type',
    title: 'Фотографии товара',
    description: 'Загрузите до 10 фотографий. Первое фото станет обложкой в каталоге. Товары с качественными фото получают в 5 раз больше просмотров!',
    position: 'bottom',
  },
  {
    target: 'input[placeholder*="Кухня"]',
    title: 'Название',
    description: 'Напишите понятное название товара. Покупатели ищут по ключевым словам: материал, стиль, назначение.',
    position: 'bottom',
  },
  {
    target: 'textarea[placeholder*="Подробное"]',
    title: 'Описание',
    description: 'Опишите материалы, размеры, особенности. Чем подробнее описание — тем выше доверие покупателей.',
    position: 'top',
  },
  {
    target: 'input[placeholder="0"]',
    title: 'Цена',
    description: 'Укажите цену в рублях. Если цена по запросу — оставьте пустым.',
    position: 'top',
  },
  {
    target: 'select',
    title: 'Категория',
    description: 'Выберите подходящую категорию. Это поможет покупателям найти ваш товар в каталоге.',
    position: 'top',
  },
  {
    target: 'button[type="submit"]',
    title: 'Создание',
    description: 'Когда всё заполнено — нажмите «Создать товар». Он сразу появится в каталоге!',
    position: 'top',
  },
];

interface ProductOnboardingProps {
  force?: boolean;
}

export default function ProductOnboarding({ force = false }: ProductOnboardingProps) {
  return <OverlayOnboarding steps={steps} storageKey="product_onboarding_done" force={force} accentColor="orange" />;
}
