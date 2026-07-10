'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getDisplayName, getDisplayInitial } from '@/lib/displayName';
import NotificationsDropdown from './NotificationsDropdown';
import SearchModal from './SearchModal';
import RoleBadge from './RoleBadge';
import { useTheme } from './ThemeProvider';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar: string | null;
}

const navLinks = [
  { href: '/feed', label: 'Лента' },
  { href: '/gallery', label: 'Каталог' },
  { href: '/products', label: 'Товары' },
  { href: '/groups', label: 'Группы' },
  { href: '/events', label: 'События' },
  { href: '/documents', label: 'Документы' },
  { href: '/refs', label: 'Справочники' },
];

const participantsLinks = [
  { href: '/specialists', label: 'Специалисты' },
  { href: '/suppliers', label: 'Поставщики' },
  { href: '/manufacturers', label: 'Производства' },
  { href: '/companies', label: 'Компании' },
];

export default function Header() {
  const [user, setUser] = useState<UserData | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) {
        setCatalogOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          if (!res.ok) { localStorage.removeItem('token'); return null; }
          return res.json();
        })
        .then(data => {
          if (data?.user) setUser(data.user);
        })
        .catch(() => { localStorage.removeItem('token'); setUser(null); });
    } else {
      setUser(null);
    }
  }, [pathname]);

  useEffect(() => { setUserMenuOpen(false); }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; max-age=0';
    setUser(null);
    setUserMenuOpen(false);
    router.push('/');
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-glass' : 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm'}`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16 gap-3">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0 ml-2 lg:ml-6">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
              <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 hidden sm:block">
              Меб<span className="text-brand-500">Портал</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
            {navLinks.map(link => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2 shrink-0 relative" ref={catalogRef}>
            <button
              onClick={() => setCatalogOpen(!catalogOpen)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 whitespace-nowrap flex items-center gap-1 ${
                participantsLinks.some(l => pathname === l.href || pathname?.startsWith(l.href + '/'))
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Участники
              <svg className={`w-3 h-3 transition-transform ${catalogOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {catalogOpen && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-gray-700 py-2 animate-fade-in-down z-[100]">
                {participantsLinks.map(link => {
                  const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setCatalogOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <SearchModal />
            <button
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-amber-500 hover:bg-amber-50 transition-colors"
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-1">
                <NotificationsDropdown />
                <Link href="/dashboard" className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </Link>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="relative">
                      {user.avatar ? (
                        <div className="w-7 h-7 rounded-full overflow-hidden relative">
                           <Image src={user.avatar} alt="" fill unoptimized sizes="28px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {getDisplayInitial(user.name, user.role).toUpperCase()}
                        </div>
                      )}
                      <RoleBadge role={user.role} size="sm" />
                    </div>
                    <span className="text-sm font-medium text-gray-600 max-w-[100px] truncate hidden xl:block">{getDisplayName(user.name, user.role)}</span>
                    <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-float border border-gray-100 dark:border-gray-700 py-2 animate-fade-in-down">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brand-100 relative">
                               <Image src={user.avatar} alt="" fill unoptimized sizes="40px" className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 gradient-brand rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {getDisplayInitial(user.name, user.role).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{getDisplayName(user.name, user.role)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <Link href={`/profile/${user.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                        Моя страница
                      </Link>
                      <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                        Личный кабинет
                      </Link>
                      {user.role === 'ADMIN' && (
                        <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                          Админ-панель
                        </Link>
                      )}
                      <Link href="/shortcuts" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>
                        Горячие клавиши
                      </Link>
                      <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 w-full transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                          Выйти
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-ghost text-sm">Войти</Link>
                <Link href="/register" className="btn-primary text-sm !px-4 !py-2">Регистрация</Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
