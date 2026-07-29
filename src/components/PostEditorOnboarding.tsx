'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface OnboardingStep {
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'center';
}

interface PostEditorOnboardingProps {
  force?: boolean;
}

const STORAGE_KEY = 'post_editor_onboarding_done';

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

export default function PostEditorOnboarding({ force = false }: PostEditorOnboardingProps) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!force && localStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setActive(true), 600);
    return () => clearTimeout(timer);
  }, [force]);

  const updateRect = useCallback(() => {
    if (!active || step >= steps.length) return;
    const el = document.querySelector(steps[step].target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    }
  }, [active, step]);

  useEffect(() => {
    if (!active) return;
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [active, step, updateRect]);

  const finish = () => {
    setActive(false);
    localStorage.setItem(STORAGE_KEY, '1');
  };

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!active || !targetRect) return null;

  const current = steps[step];
  const pad = 12;
  const clipLeft = targetRect.left - pad;
  const clipTop = targetRect.top - pad;
  const clipRight = targetRect.right + pad;
  const clipBottom = targetRect.bottom + pad;

  const tooltipBelow = current.position === 'bottom';
  const tooltipTop = tooltipBelow ? clipBottom + 12 : undefined;
  const tooltipBottom = !tooltipBelow && current.position === 'top' ? undefined : undefined;

  let tooltipStyle: React.CSSProperties;
  if (tooltipBelow) {
    tooltipStyle = { top: clipBottom + 12, left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 340)) };
  } else if (current.position === 'center') {
    tooltipStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  } else {
    const bottomEdge = clipTop - 12;
    tooltipStyle = { bottom: window.innerHeight - clipTop + 12, left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 340)) };
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[200] animate-fade-in" style={{ pointerEvents: 'auto' }}>
      {/* Overlay with spotlight cutout */}
      <div
        className="absolute inset-0 bg-black/50 transition-all duration-300"
        style={{
          clipPath: `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%,
            0% ${clipTop}px,
            ${clipLeft}px ${clipTop}px,
            ${clipLeft}px ${clipBottom}px,
            ${clipRight}px ${clipBottom}px,
            ${clipRight}px ${clipTop}px,
            0% ${clipTop}px
          )`,
        }}
        onClick={finish}
      />

      {/* Highlight ring around target */}
      <div
        className="absolute rounded-xl border-2 border-brand-400 shadow-[0_0_0_4px_rgba(99,102,241,0.2)] transition-all duration-300 pointer-events-none"
        style={{
          top: clipTop,
          left: clipLeft,
          width: clipRight - clipLeft,
          height: clipBottom - clipTop,
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute w-[300px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-5 animate-fade-in-up"
        style={{ ...tooltipStyle, zIndex: 201 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {step + 1}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{step + 1} из {steps.length}</span>
        </div>
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">{current.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{current.description}</p>

        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center mb-4">
          {steps.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-brand-500 w-5' : i < step ? 'bg-brand-300' : 'bg-gray-200 dark:bg-gray-600'}`} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={finish}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mr-auto"
          >
            Пропустить обучение
          </button>
          {step > 0 && (
            <button
              onClick={prev}
              className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Назад
            </button>
          )}
          <button
            onClick={next}
            className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {step < steps.length - 1 ? 'Далее' : 'Начать!'}
          </button>
        </div>
      </div>
    </div>
  );
}
