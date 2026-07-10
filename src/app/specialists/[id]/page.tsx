'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SkeletonPage } from '@/components/Loading';
import StarRating from '@/components/StarRating';
import toast from 'react-hot-toast';
import PageSEO from '@/components/PageSEO';

interface SpecialistData {
  id: string;
  type: string;
  description: string | null;
  experience: number | null;
  rating: number;
  portfolio: string | null;
  user: { id: string; name: string | null; email: string; phone: string | null; avatar: string | null };
}

const typeLabels: Record<string, string> = { MANAGER: 'Менеджер', DESIGNER: 'Дизайнер', TECHNOLOGIST: 'Технолог', INSTALLER: 'Установщик' };

export default function SpecialistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [specialist, setSpecialist] = useState<SpecialistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userScore, setUserScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSpecialist = async () => {
      try { const res = await fetch(`/api/specialists/${params.id}`, { signal: controller.signal }); const data = await res.json(); setSpecialist(data.specialist); }
      catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSpecialist(null);
      } finally { setLoading(false); }
    };
    fetchSpecialist();
    return () => controller.abort();
  }, [params.id]);

  const handleRate = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    if (userScore === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/specialists/${params.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ score: userScore, comment: comment || undefined }),
      });
      const data = await res.json();
      if (res.ok) { setSpecialist(prev => prev ? { ...prev, rating: data.rating } : prev); toast.success('Спасибо за оценку!'); setUserScore(0); setComment(''); }
      else { toast.error(data.error || 'Ошибка'); }
    } catch { toast.error('Ошибка сети'); } finally { setSubmitting(false); }
  };

  if (loading) return <SkeletonPage />;
  if (!specialist) return <div className="text-center py-20 text-gray-500">Специалист не найден</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      <PageSEO title={specialist.user.name || 'Специалист'} description={specialist.description?.slice(0, 160) || `Специалист на МебПортал: ${specialist.user.name}`} />
      <div className="section-container py-10 max-w-4xl">
        <button onClick={() => router.back()} className="btn-ghost mb-6 -ml-4 animate-fade-in">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад к специалистам
        </button>

        <div className="card-base overflow-hidden animate-fade-in-up stagger-1">
          <div className="gradient-hero p-5 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0"><div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl animate-float-slow" /></div>
            <div className="relative flex items-center gap-4 sm:gap-6">
              {specialist.user.avatar ? (
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white/30 shadow-glass animate-scale-in flex-shrink-0">
                  <Image src={specialist.user.avatar} alt="" fill className="object-cover" sizes="96px" unoptimized />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl sm:text-4xl font-bold border border-white/20 shadow-glass animate-scale-in flex-shrink-0">
                  {specialist.user.name?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{specialist.user.name}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="badge bg-white/15 border border-white/20 text-white text-xs">{typeLabels[specialist.type] || specialist.type}</span>
                  <span className="text-white/80 text-sm flex items-center gap-1"><svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>{specialist.rating.toFixed(1)}</span>
                  <span className="text-white/60 text-sm">Опыт: {specialist.experience || 0} лет</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="animate-fade-in-up stagger-2">
                <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">О себе</h2>
                {specialist.description ? <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{specialist.description}</p> : <p className="text-gray-400 dark:text-gray-500 italic">Не указано</p>}
              </div>
              {specialist.portfolio && (
                <div className="animate-fade-in-up stagger-3">
                  <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Портфолио</h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{specialist.portfolio}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mb-6 animate-fade-in-up stagger-4">
              <Link href={`/portfolio/${specialist.user.id}`} className="btn-primary !px-5 !py-2.5 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                Портфолио
              </Link>
              <Link href={`/feed?authorId=${specialist.user.id}`} className="btn-secondary !px-5 !py-2.5 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
                Посты
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-6">
              {specialist.user.phone && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100/70 dark:hover:bg-gray-700 transition-colors animate-fade-in-up stagger-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg></div>
                  <div><p className="text-xs text-gray-400 dark:text-gray-500">Телефон</p><p className="font-medium text-gray-900 dark:text-gray-100">{specialist.user.phone}</p></div>
                </div>
              )}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100/70 dark:hover:bg-gray-700 transition-colors animate-fade-in-up stagger-5">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                <div><p className="text-xs text-gray-400 dark:text-gray-500">Специалист</p><p className="font-medium text-gray-900 dark:text-gray-100">{specialist.user.name || 'Пользователь'}</p></div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl animate-fade-in-up stagger-6">
              <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Оценить специалиста</h2>
              <div className="flex items-center gap-4 mb-4">
                <StarRating rating={userScore} onChange={setUserScore} size="lg" />
                <span className="text-gray-400 dark:text-gray-500 text-sm">{userScore > 0 ? `${userScore}/5` : 'Выберите оценку'}</span>
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Комментарий (необязательно)" className="input-premium resize-none" rows={3} />
              <div className="flex items-center gap-4 mt-4">
                <button onClick={handleRate} disabled={submitting || userScore === 0} className="btn-primary !px-5 !py-2.5 text-sm">
                  {submitting ? 'Отправка...' : 'Оценить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
