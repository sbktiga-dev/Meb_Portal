'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      fetch(`/api/auth/verify-email/confirm?token=${token}`)
        .then(res => {
          if (res.redirected) {
            setStatus('success');
            setMessage('Email подтверждён! Теперь вы можете войти.');
          } else if (res.ok) {
            setStatus('success');
            setMessage('Email подтверждён!');
          } else {
            setStatus('error');
            setMessage('Невалидный или просроченный токен');
          }
        })
        .catch(() => {
          setStatus('error');
          setMessage('Ошибка подтверждения');
        });
    } else {
      setStatus('error');
      setMessage('Токен не указан');
    }
  }, [token]);

  return (
    <div className="bg-white rounded-2xl shadow-card p-8 text-center">
      {status === 'loading' && (
        <>
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-6" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Подтверждение email...</h1>
          <p className="text-gray-500">Пожалуйста, подождите</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Email подтверждён!</h1>
          <p className="text-gray-500 mb-6">{message}</p>
          <Link href="/login" className="btn-primary inline-flex">
            Войти в аккаунт
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h1>
          <p className="text-gray-500 mb-6">{message}</p>
          <Link href="/" className="btn-primary inline-flex">
            На главную
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-brand-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-brand-50/50 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">Меб<span className="text-gradient">Портал</span></span>
          </Link>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl shadow-card p-8 text-center"><div className="w-16 h-16 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" /></div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
