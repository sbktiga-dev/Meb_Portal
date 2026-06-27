'use client';

import Link from 'next/link';
import { HOTKEY_LIST } from '@/hooks/useHotkeys';

export default function ShortcutsPage() {
  return (
    <div className="min-h-screen">
      <div className="section-container py-10 md:py-14 max-w-2xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <Link href="/" className="text-sm text-gray-400 hover:text-brand-500 transition-colors mb-4 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
            На главную
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">Горячие клавиши</h1>
          <p className="text-gray-500 mt-1">Быстрое управление порталом</p>
        </div>

        <div className="card-base p-6 animate-fade-in-up stagger-1">
          <div className="space-y-4">
            {HOTKEY_LIST.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <span className="text-gray-700 font-medium">{item.description}</span>
                <div className="flex items-center gap-1.5">
                  {item.keys.map((key, j) => (
                    <span key={j}>
                      <kbd className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg shadow-sm">
                        {key}
                      </kbd>
                      {j < item.keys.length - 1 && <span className="text-gray-300 mx-1">+</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 card-base p-6 animate-fade-in-up stagger-2">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Значки ролей</h2>
          <p className="text-sm text-gray-500 mb-4">Цветные значки на аватарках показывают роль участника</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '✦', label: 'Специалист', color: 'bg-purple-500', desc: 'Дизайнер, технолог, монтажник, менеджер' },
              { icon: '◆', label: 'Компания', color: 'bg-blue-500', desc: 'Компания или ИП в мебельной отрасли' },
              { icon: '●', label: 'Поставщик', color: 'bg-emerald-500', desc: 'Поставщик материалов и фурнитуры' },
              { icon: '■', label: 'Производство', color: 'bg-amber-500', desc: 'Мебельное производство' },
              { icon: '○', label: 'Клиент', color: 'bg-gray-400', desc: 'Заказчик мебели' },
              { icon: '★', label: 'Администратор', color: 'bg-red-500', desc: 'Администратор портала' },
            ].map(role => (
              <div key={role.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <span className={`w-8 h-8 ${role.color} text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                  {role.icon}
                </span>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{role.label}</div>
                  <div className="text-xs text-gray-500">{role.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 card-base p-6 animate-fade-in-up stagger-3">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Навигация</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/feed', label: 'Лента новостей', icon: '📰' },
              { href: '/gallery', label: 'Каталог изображений', icon: '🖼' },
              { href: '/documents', label: 'Документы', icon: '📄' },
              { href: '/specialists', label: 'Специалисты', icon: '👤' },
              { href: '/suppliers', label: 'Поставщики', icon: '🏭' },
              { href: '/companies', label: 'Компании', icon: '🏢' },
              { href: '/dashboard', label: 'Личный кабинет', icon: '⚙' },
              { href: '/dashboard/portfolio', label: 'Портфолио', icon: '🎨' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <span className="text-xl">{link.icon}</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-brand-600 transition-colors">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
