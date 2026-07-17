'use client';

import { useState, useEffect } from 'react';

interface OnboardingTooltipProps {
  pageKey: string;
  title: string;
  text: string;
  icon?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const positionClasses = {
  'top-left': 'top-20 left-4',
  'top-right': 'top-20 right-4',
  'bottom-left': 'bottom-24 left-4 md:bottom-8',
  'bottom-right': 'bottom-24 right-4 md:bottom-8',
};

export default function OnboardingTooltip({ pageKey, title, text, icon = '💡', position = 'bottom-right' }: OnboardingTooltipProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(`onboard_${pageKey}`);
    if (!seen) {
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, [pageKey]);

  const close = () => {
    localStorage.setItem(`onboard_${pageKey}`, '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-[150] animate-in fade-in slide-in-from-bottom-4 duration-300`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-w-xs p-4 relative">
        <button onClick={close} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">{title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{text}</p>
          </div>
        </div>
        <button onClick={close} className="mt-3 w-full py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-lg transition">
          Понятно
        </button>
      </div>
    </div>
  );
}
