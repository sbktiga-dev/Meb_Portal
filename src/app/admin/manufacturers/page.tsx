'use client';

import { useState, useEffect } from 'react';

interface Manufacturer {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  capabilities: string[];
  isVerified: boolean;
}

export default function AdminManufacturersPage() {
  const [items, setItems] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', address: '', phone: '', email: '', website: '', capabilities: '', geometry: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchData = (signal?: AbortSignal) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/manufacturers?limit=100', { headers: { Authorization: `Bearer ${token}` }, signal })
      .then(r => r.json())
      .then(d => setItems(d.manufacturers || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, []);

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token || !form.name.trim()) return;
    setSaving(true);
    setMsg('');
    try {
      const caps = form.capabilities.split(',').map(c => c.trim()).filter(Boolean);
      const res = await fetch('/api/manufacturers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, capabilities: caps }),
      });
      if (res.ok) {
        setMsg('Производство создано!');
        setShowForm(false);
        setForm({ name: '', description: '', address: '', phone: '', email: '', website: '', capabilities: '', geometry: '' });
        fetchData();
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
    if (!confirm('Удалить производство?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch(`/api/manufacturers/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Производства ({items.length})</h1>
          <button onClick={() => setShowForm(!showForm)} className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition">
            {showForm ? 'Отмена' : '+ Добавить'}
          </button>
        </div>

        {msg && <div className={`mb-4 p-3 rounded-lg text-sm ${msg.includes('Ошибка') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{msg}</div>}

        {showForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Новое производство</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <input type="text" placeholder="Название *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
              <input type="text" placeholder="Адрес" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
              <input type="text" placeholder="Телефон" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
              <input type="text" placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
              <input type="text" placeholder="Сайт" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
              <input type="text" placeholder="Возможности (через запятую)" value={form.capabilities} onChange={e => setForm(p => ({ ...p, capabilities: e.target.value }))} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
              <input type="text" placeholder="География" value={form.geometry} onChange={e => setForm(p => ({ ...p, geometry: e.target.value }))} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500" />
              <textarea placeholder="Описание" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 min-h-[80px]" />
            </div>
            <button onClick={handleCreate} disabled={saving || !form.name.trim()} className="mt-4 bg-amber-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-amber-700 transition disabled:opacity-50">
              {saving ? 'Создание...' : 'Создать'}
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Название</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Адрес</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Возможности</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.address || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.capabilities.join(', ')}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700 text-sm">Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
