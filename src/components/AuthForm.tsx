'use client';

import { useState } from 'react';
import Link from 'next/link';

interface AuthFormProps {
  type: 'login' | 'register';
  onSubmit: (data: Record<string, string>) => Promise<void>;
  error?: string;
}

export default function AuthForm({ type, onSubmit, error }: AuthFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    inn: '',
    role: 'USER',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {type === 'register' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white dark:bg-gray-800 dark:border-gray-700 dark:focus:bg-gray-700 transition"
            placeholder="Ваше имя"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white dark:bg-gray-800 dark:border-gray-700 dark:focus:bg-gray-700 transition"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Пароль</label>
        <input
          type="password"
          required
          minLength={6}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white dark:bg-gray-800 dark:border-gray-700 dark:focus:bg-gray-700 transition"
          placeholder="Минимум 6 символов"
        />
      </div>

      {type === 'register' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ИНН (необязательно)</label>
            <input
              type="text"
              value={formData.inn}
              onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white dark:bg-gray-800 dark:border-gray-700 dark:focus:bg-gray-700 transition"
              placeholder="ИНН для верификации"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Тип аккаунта</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white dark:bg-gray-800 dark:border-gray-700 dark:focus:bg-gray-700 transition"
            >
              <option value="USER">Специалист</option>
              <option value="COMPANY">Компания / ИП</option>
              <option value="SUPPLIER">Поставщик</option>
              <option value="MANUFACTURER">Производство</option>
            </select>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Подождите...' : type === 'login' ? 'Войти' : 'Зарегистрироваться'}
      </button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        {type === 'login' ? (
          <>
            Нет аккаунта?{' '}
            <Link href="/register" className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium">
              Зарегистрироваться
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium">
              Войти
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
