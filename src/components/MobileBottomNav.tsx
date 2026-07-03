'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { getDisplayInitial } from '@/lib/displayName';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          if (d.user) {
            setUserId(d.user.id);
            setUserName(d.user.name);
            setUserRole(d.user.role);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const navItems = [
    { href: '/feed', label: 'Лента', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg> },
    { href: '/gallery', label: 'Каталог', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> },
    { href: '/feed/new', label: 'Пост', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>, isCenter: true },
    { href: userId ? `/profile/${userId}` : '/login', label: 'Моя страница', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
  ];

  const isActive = (href: string) => {
    if (pathname === href) return true;
    // For /feed, don't match /feed/new
    if (href === '/feed' && pathname === '/feed/new') return false;
    return pathname?.startsWith(href + '/') ?? false;
  };

  const moreLinks = [
    { href: '/dashboard', label: 'Личный кабинет' },
    { href: '/groups', label: 'Группы' },
    { href: '/events', label: 'События' },
    { href: '/products', label: 'Товары' },
    { href: '/documents', label: 'Документы' },
    { href: '/refs', label: 'Справочники' },
    { href: '/specialists', label: 'Специалисты' },
    { href: '/suppliers', label: 'Поставщики' },
    { href: '/manufacturers', label: 'Производства' },
    { href: '/companies', label: 'Компании' },
  ];

  return (
    <>
      {/* More menu overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-[59]" onClick={() => setMenuOpen(false)}>
          <div
            ref={menuRef}
            className="absolute bottom-16 left-2 right-2 bg-white rounded-2xl shadow-2xl p-3 max-h-[60vh] overflow-y-auto animate-fade-in-down"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-3 py-2.5 mb-2 border-b border-gray-100">
              {userId ? (
                <Link href={`/profile/${userId}`} className="flex items-center gap-3 flex-1" onClick={() => setMenuOpen(false)}>
                  <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {getDisplayInitial(userName || undefined, userRole || undefined)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Моя страница</p>
                    <p className="text-xs text-gray-400">Профиль</p>
                  </div>
                </Link>
              ) : (
                <Link href="/login" className="flex items-center gap-3 flex-1" onClick={() => setMenuOpen(false)}>
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-sm">?</div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Войти</p>
                    <p className="text-xs text-gray-400">Авторизация</p>
                  </div>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {moreLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-colors ${
                    isActive(link.href) ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xs font-medium leading-tight">{link.label}</span>
                </Link>
              ))}
              {userRole === 'ADMIN' && (
                <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex flex-col items-center gap-1 p-3 rounded-xl text-center text-gray-600 hover:bg-gray-50">
                  <span className="text-xs font-medium leading-tight">Админ</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-[60] safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[52px] ${
                item.isCenter
                  ? 'text-brand-600'
                  : isActive(item.href)
                    ? 'text-brand-600'
                    : 'text-gray-400'
              }`}
            >
              <span className={item.isCenter ? 'text-brand-500 scale-110' : isActive(item.href) ? 'text-brand-500' : ''}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-200 min-w-[52px] ${
              menuOpen ? 'text-brand-600' : 'text-gray-400'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-[10px] font-medium leading-tight">Ещё</span>
          </button>
        </div>
      </nav>
    </>
  );
}
