'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'USER', inn: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      localStorage.setItem('token', data.token);
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

      try {
        await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { Authorization: `Bearer ${data.token}` },
        });
      } catch {}

      window.location.href = '/dashboard';
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
            <span className="text-2xl font-bold text-gray-900">Меб<span className="text-gradient">Портал</span></span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Создать аккаунт</h1>
          <p className="text-gray-500 mt-2">Присоединяйтесь к мебельному сообществу</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Имя</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-premium" placeholder="Ваше имя" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-premium" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Пароль *</label>
              <input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-premium" placeholder="Минимум 6 символов" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ИНН <span className="font-normal text-gray-400">(для ИП/компаний)</span></label>
              <input type="text" value={form.inn} onChange={e => setForm({ ...form, inn: e.target.value })} className="input-premium" placeholder="Необязательно" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Роль</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="input-premium">
                <option value="USER">Специалист</option>
                <option value="COMPANY">Компания / ИП</option>
                <option value="SUPPLIER">Поставщик</option>
                <option value="MANUFACTURER">Производство</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-brand-600 hover:text-brand-700 font-semibold">Войти</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
