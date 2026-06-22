'use client';

import { useState, useEffect } from 'react';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  inn: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.role !== 'ADMIN') { window.location.href = '/dashboard'; return; }
      });

    fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setUsers(data.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const roleLabels: Record<string, string> = {
    USER: 'Специалист',
    SPECIALIST: 'Специалист',
    COMPANY: 'Компания',
    SUPPLIER: 'Поставщик',
    MANUFACTURER: 'Производство',
    ADMIN: 'Админ',
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Управление пользователями</h1>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Email</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Имя</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Роль</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">ИНН</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs">{roleLabels[u.role] || u.role}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.inn || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
