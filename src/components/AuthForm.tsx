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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {type === 'register' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white transition"
            placeholder="Ваше имя"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white transition"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
        <input
          type="password"
          required
          minLength={6}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white transition"
          placeholder="Минимум 6 символов"
        />
      </div>

      {type === 'register' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ИНН (необязательно)</label>
            <input
              type="text"
              value={formData.inn}
              onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white transition"
              placeholder="ИНН для верификации"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип аккаунта</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 focus:bg-white transition"
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
        className="w-full bg-amber-600 text-white py-3 rounded-xl font-semibold hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Подождите...' : type === 'login' ? 'Войти' : 'Зарегистрироваться'}
      </button>

      <p className="text-center text-sm text-gray-500">
        {type === 'login' ? (
          <>
            Нет аккаунта?{' '}
            <Link href="/register" className="text-amber-600 hover:text-amber-700 font-medium">
              Зарегистрироваться
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
              Войти
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
