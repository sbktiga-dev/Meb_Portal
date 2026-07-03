'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

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
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleDelete = async (userId: string, userName: string | null, userEmail: string) => {
    const displayName = userName || userEmail;
    if (!confirm(`Удалить пользователя "${displayName}"? Это действие необратимо.`)) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setDeleting(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Ошибка удаления');
        return;
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success(`Пользователь "${displayName}" удалён`);
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setDeleting(null);
    }
  };

  const roleLabels: Record<string, string> = {
    USER: 'Специалист',
    SPECIALIST: 'Специалист',
    COMPANY: 'Компания',
    SUPPLIER: 'Поставщик',
    MANUFACTURER: 'Производство',
    CLIENT: 'Клиент',
    ADMIN: 'Админ',
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Управление пользователями</h1>
          <span className="text-sm text-gray-500">{users.length} пользователей</span>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Email</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Имя</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Роль</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">ИНН</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                        u.role === 'COMPANY' ? 'bg-blue-100 text-blue-700' :
                        u.role === 'SUPPLIER' ? 'bg-emerald-100 text-emerald-700' :
                        u.role === 'MANUFACTURER' ? 'bg-amber-100 text-amber-700' :
                        u.role === 'CLIENT' ? 'bg-gray-100 text-gray-600' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.inn || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(u.id, u.name, u.email)}
                          disabled={deleting === u.id}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          {deleting === u.id ? 'Удаление...' : 'Удалить'}
                        </button>
                      )}
                    </td>
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
