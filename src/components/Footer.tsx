import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="section-container py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-10">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Меб<span className="text-brand-400">Портал</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-5 text-slate-500">
              Профессиональная платформа для мебельной отрасли. Каталоги, документы, поставщики.
            </p>
            <div className="flex gap-2">
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-brand-500 hover:text-white transition-all duration-200" aria-label="Telegram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-brand-500 hover:text-white transition-all duration-200" aria-label="Email">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Каталоги</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/feed', label: 'Лента новостей' },
                { href: '/gallery', label: 'Изображения' },
                { href: '/products', label: 'Товары' },
                { href: '/documents', label: 'Документы' },
                { href: '/refs', label: 'Справочники' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors duration-150">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Партнёры</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/suppliers', label: 'Поставщики' },
                { href: '/companies', label: 'Компании' },
                { href: '/manufacturers', label: 'Производства' },
                { href: '/specialists', label: 'Специалисты' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors duration-150">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Платформа</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/groups', label: 'Группы' },
                { href: '/events', label: 'События' },
                { href: '/shortcuts', label: 'Горячие клавиши' },
                { href: '/dashboard', label: 'Личный кабинет' },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors duration-150">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">&copy; 2026 МебПортал. Все права защищены.</p>
          <div className="flex gap-5 text-sm text-slate-500">
            <Link href="/shortcuts" className="hover:text-white transition-colors">Горячие клавиши</Link>
            <a href="#" className="hover:text-white transition-colors">Политика</a>
            <a href="#" className="hover:text-white transition-colors">Условия</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
