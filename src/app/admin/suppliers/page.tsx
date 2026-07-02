'use client';

import { useState, useEffect } from 'react';

interface Supplier {
  id: string;
  companyName: string;
  description: string | null;
  categories: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  isVerified: boolean;
  _count?: { products: number };
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ companyName: '', description: '', categories: '', phone: '', email: '', website: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchSuppliers = (signal?: AbortSignal) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/suppliers?limit=100', { headers: { Authorization: `Bearer ${token}` }, signal })
      .then(r => r.json())
      .then(d => setSuppliers(d.suppliers || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchSuppliers(controller.signal);
    return () => controller.abort();
  }, []);

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token || !form.companyName.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      const cats = form.categories.split(',').map(c => c.trim()).filter(Boolean);
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, categories: cats }),
      });
      if (res.ok) {
        setMsg('Поставщик создан!');
        setShowForm(false);
        setForm({ companyName: '', description: '', categories: '', phone: '', email: '', website: '' });
        fetchSuppliers();
      } else {
        const d = await res.json();
        setMsg(d.error || 'Ошибка');
      }
    } catch {
      setMsg('Ошибка сети');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить поставщика?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) fetchSuppliers();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Поставщики ({suppliers.length})</h1>
          <button onClick={() => setShowForm(!showForm)} className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition">
            {showForm ? 'Отмена' : '+ Добавить'}
          </button>
        </div>

        {msg && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.includes('Ошибка') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{msg}</div>}

        {showForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Новый поставщик</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="text" placeholder="Название *" value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
              <input type="text" placeholder="Телефон" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
              <input type="text" placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
              <input type="text" placeholder="Сайт" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
              <input type="text" placeholder="Категории (через запятую)" value={form.categories} onChange={e => setForm(p => ({ ...p, categories: e.target.value }))} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
              <textarea placeholder="Описание" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 min-h-[80px]" />
            </div>
            <button onClick={handleCreate} disabled={saving || !form.companyName.trim()} className="mt-4 bg-amber-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-amber-700 transition disabled:opacity-50">
              {saving ? 'Создание...' : 'Создать'}
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Название</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Категории</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Товаров</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Статус</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {suppliers.map(s => {
                const cats: string[] = (() => { try { return JSON.parse(s.categories); } catch { return []; } })();
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.companyName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{cats.join(', ')}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{s._count?.products || 0}</td>
                    <td className="px-6 py-4 text-sm">
                      {s.isVerified ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-xs">Проверен</span> : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg text-xs">Новый</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 text-sm">Удалить</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
