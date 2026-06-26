'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, useEffect, useState } from 'react';
import FollowButton from '@/components/FollowButton';

interface Stats {
  users: number;
  images: number;
  documents: number;
  suppliers: number;
  companies: number;
  specialists: number;
}

interface ImageData {
  id: string;
  title: string;
  url: string;
  style: string | null;
  category: string | null;
  downloads: number;
}

interface DocumentData {
  id: string;
  title: string;
  category: string;
  fileType: string;
  downloads: number;
}

interface PostData {
  id: string;
  title: string;
  content: string;
  category: string;
  images: string;
  tags: string;
  likes: number;
  views: number;
  createdAt: string;
  author: { id: string; name: string | null; avatar: string | null };
  _count: { comments: number; likesList: number };
}

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500;
          const steps = 60;
          const increment = value / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
              setCount(value);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <div ref={ref} className="text-4xl md:text-5xl font-bold text-brand-500 tabular-nums">{count}</div>;
}

export default function HomeContent({
  stats,
  images: recentImages,
  documents: popularDocs,
  feedPosts,
}: {
  stats: Stats;
  images: ImageData[];
  documents: DocumentData[];
  feedPosts: PostData[];
}) {
  return (
    <div>
      <section className="relative overflow-hidden gradient-hero text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-400/8 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative section-container py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 mb-8 animate-fade-in-down">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-soft" />
              <span className="text-sm font-medium text-white/80">Платформа для мебельной отрасли</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight animate-fade-in-up">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/80 drop-shadow-[0_0_24px_rgba(255,255,255,0.4)]">Библиотека</span><br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500">мебельщика</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up stagger-2 text-balance">
              Тысячи изображений мебели, шаблоны документов, технические справочники и каталог поставщиков — всё бесплатно для профессионалов
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-3">
              <Link href="/gallery" className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white text-gray-900 font-semibold rounded-2xl shadow-float hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                Смотреть каталог
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white/10 text-white border border-white/20 font-semibold rounded-2xl hover:bg-white/20 backdrop-blur-sm active:scale-[0.98] transition-all duration-200">
                Зарегистрироваться бесплатно
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      <section className="relative -mt-10 z-10 section-container">
        <div className="bg-white rounded-3xl shadow-card p-8 md:p-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-4">
            <div className="text-center">
              <AnimatedCounter value={stats.images} />
              <div className="text-[#717171] mt-2 font-medium">Изображений</div>
            </div>
            <div className="text-center">
              <AnimatedCounter value={stats.documents} />
              <div className="text-[#717171] mt-2 font-medium">Документов</div>
            </div>
            <div className="text-center">
              <AnimatedCounter value={(stats.companies || 0) + (stats.suppliers || 0)} />
              <div className="text-[#717171] mt-2 font-medium">Компаний</div>
            </div>
            <div className="text-center">
              <AnimatedCounter value={stats.specialists || 0} />
              <div className="text-[#717171] mt-2 font-medium">Специалистов</div>
            </div>
            <div className="text-center">
              <AnimatedCounter value={stats.users} />
              <div className="text-[#717171] mt-2 font-medium">Пользователей</div>
            </div>
          </div>
        </div>
      </section>

      {recentImages.length > 0 && (
        <section className="section-padding section-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="page-title">Популярные изображения</h2>
              <p className="page-subtitle">Самые скачиваемые из каталога</p>
            </div>
            <Link href="/gallery" className="hidden sm:inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-semibold transition-colors">
              Смотреть все
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {recentImages.map((img) => (
              <Link key={img.id} href={`/gallery/${img.id}`} className="card-base overflow-hidden group">
                <div className="bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 h-36 md:h-40 overflow-hidden group-hover:from-brand-100 group-hover:to-orange-100 transition-all duration-300">
                  {img.url ? (
                    <img src={img.url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-200">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <h3 className="font-semibold text-sm truncate group-hover:text-brand-600 transition-colors">{img.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400 font-medium">{img.downloads} загрузок</span>
                    {img.style && <span className="badge-brand text-[10px]">{img.style}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Link href="/gallery" className="sm:hidden flex items-center justify-center gap-1.5 text-brand-600 font-semibold mt-6">
            Смотреть все изображения →
          </Link>
        </section>
      )}

      {feedPosts.length > 0 && (
        <section className="section-padding section-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="page-title">Лента новостей</h2>
              <p className="page-subtitle">Последние публикации от участников</p>
            </div>
            <Link href="/feed" className="hidden sm:inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-semibold transition-colors">
              Смотреть все
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>
          <div className="max-w-2xl mx-auto space-y-6">
            {feedPosts.map((post) => {
              const tags: string[] = (() => { try { return JSON.parse(post.tags); } catch { return []; } })();
              const postImages: string[] = (() => { try { return JSON.parse(post.images); } catch { return []; } })();
              const categoryLabels: Record<string, { label: string; color: string }> = {
                news: { label: 'Новость', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                project: { label: 'Проект', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                article: { label: 'Статья', color: 'bg-purple-50 text-purple-600 border-purple-100' },
                product: { label: 'Товар', color: 'bg-amber-50 text-amber-600 border-amber-100' },
              };
              const cat = categoryLabels[post.category] || categoryLabels.news;
              const avatarColors = ['from-brand-400 to-orange-500', 'from-emerald-400 to-teal-500', 'from-purple-400 to-pink-500', 'from-blue-400 to-indigo-500', 'from-amber-400 to-orange-500'];
              const avatarColor = avatarColors[(post.author.name?.charCodeAt(0) || 0) % 5];
              return (
                <article key={post.id} className="card-base overflow-hidden">
                  <div className="flex items-center gap-3 p-4 pb-0">
                    {post.author.avatar ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                        <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-10 h-10 bg-gradient-to-br ${avatarColor} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0`}>
                        {post.author.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm truncate">{post.author.name || 'Аноним'}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${cat.color}`}>{cat.label}</span>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <FollowButton userId={post.author.id} compact />
                  </div>
                  <div className="px-4 pt-3 pb-2">
                    <Link href={`/feed/${post.id}`}>
                      <h3 className="font-bold text-gray-900 mb-1.5 hover:text-brand-600 transition-colors leading-snug line-clamp-2">{post.title}</h3>
                    </Link>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{post.content}</p>
                  </div>
                  {postImages.length > 0 && (
                    <Link href={`/feed/${post.id}`} className="block">
                      <div className="relative mx-4 mt-2 rounded-xl overflow-hidden bg-gray-50" style={{ paddingBottom: '60%' }}>
                        <img src={postImages[0]} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                        {postImages.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-lg backdrop-blur-sm">
                            1/{postImages.length}
                          </div>
                        )}
                      </div>
                    </Link>
                  )}
                  {tags.length > 0 && (
                    <div className="px-4 pt-2.5 flex flex-wrap gap-1.5">
                      {tags.slice(0, 3).map(tag => <span key={tag} className="text-[11px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">#{tag}</span>)}
                    </div>
                  )}
                  <div className="flex items-center gap-1 px-4 py-2.5 mt-1">
                    <Link href={`/feed/${post.id}`} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                      {post._count.likesList}
                    </Link>
                    <Link href={`/feed/${post.id}`} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      {post._count.comments}
                    </Link>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      {post.views}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
          <Link href="/feed" className="sm:hidden flex items-center justify-center gap-1.5 text-brand-600 font-semibold mt-6">
            Смотреть все новости →
          </Link>
        </section>
      )}

      <section className="section-padding" style={{ background: '#f0ede7' }}>
        <div className="section-container">
          <div className="text-center mb-14">
            <h2 className="page-title">Всё для мебельщика</h2>
            <p className="page-subtitle max-w-xl mx-auto">Платформа, созданная профессионалами для профессионалов</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                href: '/gallery',
                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>,
                title: 'Библиотека изображений',
                desc: 'Тысячи качественных фото мебели в разных стилях. Скачивайте бесплатно в высоком разрешении.',
              },
              {
                href: '/documents',
                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
                title: 'Документы и справочники',
                desc: 'Шаблоны договоров, технические таблицы, паспорта фурнитуры, нормы расхода материалов.',
              },
              {
                href: '/suppliers',
                icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>,
                title: 'Каталог поставщиков',
                desc: 'Поставщики фурнитуры, ЛДСП, техники. Прайс-листы, отзывы, прямые контакты.',
              },
            ].map((feature, i) => (
              <Link key={feature.href} href={feature.href} className="card-base p-8 text-center hover-lift">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-50 text-brand-500 mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-[#6B6B6B] leading-relaxed">{feature.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {popularDocs.length > 0 && (
        <section className="section-padding section-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="page-title">Популярные документы</h2>
              <p className="page-subtitle">Шаблоны и справочники для работы</p>
            </div>
            <Link href="/documents" className="hidden sm:inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-semibold transition-colors">
              Смотреть все
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>
          <div className="space-y-3">
            {popularDocs.map(doc => {
              const iconColor = doc.fileType === 'pdf' ? 'bg-red-50 text-red-500' : doc.fileType === 'xlsx' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500';
              return (
                <Link key={doc.id} href={`/documents/${doc.id}`} className="card-base flex items-center justify-between p-5 hover-lift">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColor}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{doc.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                        <span className="badge-neutral text-[10px]">{doc.category}</span>
                        <span className="uppercase text-xs font-medium">{doc.fileType}</span>
                        <span>· {doc.downloads} загрузок</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="section-padding" style={{ background: '#f0ede7' }}>
        <div className="section-container">
          <div className="text-center mb-14">
            <h2 className="page-title">Нам доверяют профессионалы</h2>
            <p className="page-subtitle">Что говорят пользователи платформы</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Алексей К.', role: 'Дизайнер', text: 'Отличная подборка изображений. Использую для презентаций клиентам — качество на высоте, все бесплатно.' },
              { name: 'Мария С.', role: 'Технолог', text: 'Справочники по нормам и размерам экономят кучу времени. Всё под рукой, не нужно искать по разным сайтам.' },
              { name: 'Дмитрий В.', role: 'Руководитель производства', text: 'Нашли поставщика фурнитуры прямо здесь. Удобный каталог, быстрый контакт. Рекомендую всем в отрасли.' },
            ].map((t, i) => (
              <div key={i} className="card-base p-7">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(s => (
                    <svg key={s} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                </div>
                <p className="text-[#6B6B6B] leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 gradient-brand rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-[#717171]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden gradient-hero py-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-brand-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative section-container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Присоединяйтесь к профессионалам</h2>
          <p className="text-white/70 mb-10 max-w-lg mx-auto text-lg">
            Уже {stats?.users || '500+'} мебельщиков используют нашу платформу для работы
          </p>
          <Link href="/register" className="inline-flex items-center gap-2.5 px-10 py-4 bg-white text-gray-900 font-bold rounded-2xl shadow-float hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
            Начать бесплатно
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
