'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'USER', inn: '', referralCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState('');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setForm(prev => ({ ...prev, referralCode: ref }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Ошибка регистрации'); return; }

      if (data.token) {
        localStorage.setItem('token', data.token);
        document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        router.push('/dashboard');
        return;
      }
    } catch {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

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
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Меб<span className="text-gradient">Портал</span></span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Создать аккаунт</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Присоединяйтесь к мебельному сообществу</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Имя</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-premium" placeholder="Ваше имя" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email *</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-premium" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Пароль *</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-premium !pr-11" placeholder="Минимум 6 символов" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ИНН <span className="font-normal text-gray-400">(для ИП/компаний)</span></label>
              <input type="text" value={form.inn} onChange={e => setForm({ ...form, inn: e.target.value })} className="input-premium" placeholder="Необязательно" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Реферальный код <span className="font-normal text-gray-400">(необязательно)</span></label>
              <input type="text" value={form.referralCode} onChange={e => setForm({ ...form, referralCode: e.target.value })} className="input-premium" placeholder="MP-XXXXXXXX" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Вы</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-premium">
                <option value="CLIENT">Клиент — хочу заказать мебель</option>
                <option value="USER">Специалист — дизайнер, технолог</option>
                <option value="COMPANY">Компания / ИП</option>
                <option value="SUPPLIER">Поставщик</option>
                <option value="MANUFACTURER">Производство</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Зарегистрироваться'}
            </button>
          </form>

          {verifyUrl && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800 mb-2">📧 Письмо не отправилось. Подтвердите email по ссылке:</p>
              <a href={verifyUrl} className="text-brand-600 hover:text-brand-700 text-sm font-medium break-all">{verifyUrl}</a>
              <p className="text-xs text-gray-500 mt-2">Нажмите на ссылку для подтверждения</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-brand-600 hover:text-brand-700 font-semibold">Войти</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
