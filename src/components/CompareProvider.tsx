'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const MAX_COMPARE = 4;

const CompareContext = createContext<{
  items: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
}>({ items: [], add: () => {}, remove: () => {}, has: () => false, clear: () => {} });

export function useCompare() {
  return useContext(CompareContext);
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('compare');
    if (stored) {
      try { setItems(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('compare', JSON.stringify(items));
  }, [items]);

  const add = (id: string) => {
    if (items.length >= MAX_COMPARE) {
      toast.error(`Максимум ${MAX_COMPARE} товара для сравнения`);
      return;
    }
    if (items.includes(id)) return;
    setItems(prev => [...prev, id]);
    toast.success('Добавлено к сравнению');
  };

  const remove = (id: string) => {
    setItems(prev => prev.filter(i => i !== id));
  };

  const has = (id: string) => items.includes(id);

  const clear = () => setItems([]);

  const value = useMemo(() => ({ items, add, remove, has, clear }), [items, add, remove, has, clear]);

  return (
    <CompareContext.Provider value={value}>
      {children}
      {items.length > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 dark:bg-gray-800 text-white rounded-2xl shadow-float px-5 py-3 flex items-center gap-4 animate-fade-in-up">
          <span className="text-sm font-medium">Сравнение: {items.length}/{MAX_COMPARE}</span>
          <Link href={`/products/compare?ids=${items.join(',')}`} className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            Сравнить
          </Link>
          <button onClick={clear} className="text-gray-400 hover:text-white text-sm transition-colors">
            Очистить
          </button>
        </div>
      )}
    </CompareContext.Provider>
  );
}
