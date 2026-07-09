'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import PageSEO from '@/components/PageSEO';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  inn: string | null;
  banned: boolean;
  emailVerified: boolean;
  avatar: string | null;
  createdAt: string;
}

const roles = ['ALL', 'USER', 'COMPANY', 'SUPPLIER', 'MANUFACTURER', 'CLIENT', 'ADMIN'];
const roleLabels: Record<string, string> = {
  ALL: 'Все', USER: 'Специалист', COMPANY: 'Компания', SUPPLIER: 'Поставщик', MANUFACTURER: 'Производство', CLIENT: 'Клиент', ADMIN: 'Админ',
};
const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700', COMPANY: 'bg-blue-100 text-blue-700', SUPPLIER: 'bg-emerald-100 text-emerald-700',
  MANUFACTURER: 'bg-amber-100 text-amber-700', CLIENT: 'bg-gray-100 text-gray-600', USER: 'bg-purple-100 text-purple-700',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.user?.role !== 'ADMIN') router.push('/dashboard'); })
      .catch(() => router.push('/login'));
  }, [router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      const res = await fetch(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchUsers(); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleBan = async (userId: string, banned: boolean) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/users/${userId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ banned: !banned }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: !banned } : u));
      toast.success(banned ? 'Пользователь разбанен' : 'Пользователь забанен');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('Роль изменена');
    }
  };

  return (
    <div className="min-h-screen py-10">
      <PageSEO title="Админ: Пользователи" description="Управление пользователями портала" />
      <div className="section-container max-w-6xl">
        <Link href="/admin" className="text-sm text-gray-400 hover:text-brand-500 transition-colors mb-4 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад
        </Link>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
          <span className="text-sm text-gray-500">{total} всего</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" placeholder="Поиск по имени или email..." value={search} onChange={e => setSearch(e.target.value)} className="input-premium pl-11" />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="input-premium !w-auto">
            {roles.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Загрузка...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Пользователей не найдено</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Пользователь</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Роль</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Статус</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Дата</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(u => (
                    <tr key={u.id} className={`hover:bg-gray-50 ${u.banned ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0">
                              <Image src={u.avatar} alt="" fill unoptimized sizes="32px" className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {(u.name || u.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{u.name || 'Без имени'}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} className="text-xs font-medium rounded-lg border-0 bg-transparent focus:ring-2 focus:ring-brand-400 cursor-pointer" disabled={u.role === 'ADMIN'}>
                          {roles.filter(r => r !== 'ALL').map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {u.banned ? (
                          <span className="badge bg-red-50 text-red-600">Забанен</span>
                        ) : u.emailVerified ? (
                          <span className="badge bg-emerald-50 text-emerald-600">Активен</span>
                        ) : (
                          <span className="badge bg-amber-50 text-amber-600">Не подтверждён</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString('ru-RU')}</td>
                      <td className="px-4 py-3 text-right">
                        {u.role !== 'ADMIN' && (
                          <button onClick={() => handleBan(u.id, u.banned)} className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${u.banned ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                            {u.banned ? 'Разбанить' : 'Забанить'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {total > limit && (
          <div className="flex justify-center gap-2 mt-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost disabled:opacity-40">Назад</button>
            <span className="text-sm text-gray-500 self-center">Стр. {page} из {Math.ceil(total / limit)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)} className="btn-ghost disabled:opacity-40">Далее</button>
          </div>
        )}
      </div>
    </div>
  );
}
