'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/components/Loading';

interface CompanyData {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  isVerified: boolean;
  userId: string | null;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.user) setCurrentUserId(d.user.id); })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const fetchCompany = async () => {
      try { const res = await fetch(`/api/companies/${params.id}`); const data = await res.json(); setCompany(data.company); }
      catch { setCompany(null); } finally { setLoading(false); }
    };
    fetchCompany();
  }, [params.id]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        const updateRes = await fetch(`/api/companies/${company.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ logo: data.url }),
        });
        if (updateRes.ok) {
          setCompany(prev => prev ? { ...prev, logo: data.url } : prev);
        }
      }
    } catch {}
    finally { setUploading(false); }
  };

  const isOwner = currentUserId && company?.userId === currentUserId;

  if (loading) return <Loading text="Загрузка..." />;
  if (!company) return <div className="text-center py-20 text-gray-500">Компания не найдена</div>;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="section-container py-10 max-w-4xl">
        <button onClick={() => router.back()} className="btn-ghost mb-6 -ml-4 animate-fade-in">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад к компаниям
        </button>

        <div className="card-base overflow-hidden animate-fade-in-up stagger-1">
          <div className="gradient-hero p-5 sm:p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0"><div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl animate-float-slow" /></div>
            <div className="relative flex items-center gap-4 sm:gap-5">
              {isOwner ? (
                <button onClick={() => fileInputRef.current?.click()} className="relative group flex-shrink-0" disabled={uploading}>
                  {company.logo ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-glass animate-scale-in bg-white/10 backdrop-blur-sm">
                      <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold border border-white/20 shadow-glass animate-scale-in">
                      {company.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                        <circle cx="12" cy="13" r="3"/>
                      </svg>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </button>
              ) : company.logo ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-glass animate-scale-in flex-shrink-0 bg-white/10 backdrop-blur-sm">
                  <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold border border-white/20 shadow-glass animate-scale-in flex-shrink-0">
                  {company.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{company.name}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {company.isVerified && <span className="inline-flex items-center gap-1 badge bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Проверено</span>}
                  {isOwner && <span className="text-white/60 text-xs">Нажмите на логотип, чтобы загрузить</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {company.description ? <p className="text-gray-600 leading-relaxed mb-6 animate-fade-in-up stagger-2">{company.description}</p> : <p className="text-gray-400 italic mb-6 animate-fade-in-up stagger-2">Описание не указано</p>}

            {company.userId && (
              <div className="flex flex-wrap gap-3 mb-6 animate-fade-in-up stagger-3">
                <Link href={`/portfolio/${company.userId}`} className="btn-primary !px-5 !py-2.5 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  Портфолио
                </Link>
                <Link href={`/feed?authorId=${company.userId}`} className="btn-secondary !px-5 !py-2.5 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
                  Посты
                </Link>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              {company.address && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-colors animate-fade-in-up stagger-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                  <div><p className="text-xs text-gray-400">Адрес</p><p className="font-medium text-gray-900">{company.address}</p></div>
                </div>
              )}
              {company.phone && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-colors animate-fade-in-up stagger-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg></div>
                  <div><p className="text-xs text-gray-400">Телефон</p><p className="font-medium text-gray-900">{company.phone}</p></div>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-colors animate-fade-in-up stagger-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
                  <div><p className="text-xs text-gray-400">Email</p><p className="font-medium text-gray-900">{company.email}</p></div>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100/70 transition-colors animate-fade-in-up stagger-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></div>
                  <div><p className="text-xs text-gray-400">Сайт</p><a href={company.website} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-600 hover:text-brand-700">{company.website}</a></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
