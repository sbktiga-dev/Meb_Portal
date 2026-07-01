'use client';

import { useState, useEffect } from 'react';

interface ImageData {
  id: string;
  title: string;
  description: string | null;
  style: string | null;
  category: string | null;
  downloads: number;
  tags: string;
  createdAt: string;
}

export default function AdminImagesPage() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: '', style: '', category: '', tags: '' });
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', style: '', category: '', tags: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }

    fetch('/api/images?limit=100', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setImages(data.images || []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async () => {
    if (!file || !form.title) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', form.title);
      formData.append('style', form.style);
      formData.append('category', form.category);
      formData.append('tags', form.tags);

      const res = await fetch('/api/images/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setImages(prev => [data.image, ...prev]);
        setForm({ title: '', style: '', category: '', tags: '' });
        setFile(null);
        setShowUpload(false);
      }
    } catch {
      setError('Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить изображение?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    await fetch(`/api/images/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    setImages(images.filter(img => img.id !== id));
  };

  const startEdit = (img: ImageData) => {
    setEditingId(img.id);
    setEditForm({
      title: img.title,
      description: img.description || '',
      style: img.style || '',
      category: img.category || '',
      tags: (() => { try { return JSON.parse(img.tags).join(', '); } catch { return ''; } })(),
    });
  };

  const handleSave = async () => {
    if (!editingId || !editForm.title) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/images/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description || null,
          style: editForm.style || null,
          category: editForm.category || null,
          tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        const { image } = await res.json();
        setImages(images.map(img => img.id === editingId ? { ...img, ...image } : img));
        setEditingId(null);
      }
    } catch {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Управление изображениями</h1>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition"
          >
            {showUpload ? 'Отмена' : '+ Загрузить'}
          </button>
        </div>

        {/* Модальное окно редактирования */}
        {editingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">Редактировать изображение</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Стиль</label>
                      <select
                        value={editForm.style}
                        onChange={e => setEditForm({ ...editForm, style: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2"
                      >
                        <option value="">Не указан</option>
                        <option value="Классика">Классика</option>
                        <option value="Минимализм">Минимализм</option>
                        <option value="Лофт">Лофт</option>
                        <option value="Скандинавия">Скандинавия</option>
                        <option value="Модерн">Модерн</option>
                        <option value="Кантри">Кантри</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                      <select
                        value={editForm.category}
                        onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-4 py-2"
                      >
                        <option value="">Не указана</option>
                        <option value="Кухни">Кухни</option>
                        <option value="Гардеробные">Гардеробные</option>
                        <option value="Шкафы">Шкафы</option>
                        <option value="Столы">Столы</option>
                        <option value="Стеллажи">Стеллажи</option>
                        <option value="Детская">Детская</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Теги (через запятую)</label>
                    <input
                      type="text"
                      value={editForm.tags}
                      onChange={e => setEditForm({ ...editForm, tags: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSave}
                    disabled={saving || !editForm.title}
                    className="bg-amber-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-700 transition disabled:opacity-50"
                  >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Форма загрузки */}
        {showUpload && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold mb-4">Новое изображение</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2"
                  placeholder="Кухня в стиле минимализм"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Файл *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Стиль</label>
                <select
                  value={form.style}
                  onChange={e => setForm({ ...form, style: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2"
                >
                  <option value="">Не указан</option>
                  <option value="Классика">Классика</option>
                  <option value="Минимализм">Минимализм</option>
                  <option value="Лофт">Лофт</option>
                  <option value="Скандинавия">Скандинавия</option>
                  <option value="Модерн">Модерн</option>
                  <option value="Кантри">Кантри</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2"
                >
                  <option value="">Не указана</option>
                  <option value="Кухни">Кухни</option>
                  <option value="Гардеробные">Гардеробные</option>
                  <option value="Шкафы">Шкафы</option>
                  <option value="Столы">Столы</option>
                  <option value="Стеллажи">Стеллажи</option>
                  <option value="Детская">Детская</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Теги (через запятую)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2"
                  placeholder="кухня, ЛДСП, белая"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleUpload}
                disabled={uploading || !form.title || !file}
                className="bg-amber-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-700 transition disabled:opacity-50"
              >
                {uploading ? 'Загрузка...' : 'Загрузить'}
              </button>
            </div>
          </div>
        )}

        {/* Таблица */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Название</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Стиль</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Категория</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Загрузки</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Дата</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {images.map((img) => (
                <tr key={img.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{img.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {img.style ? <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs">{img.style}</span> : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {img.category ? <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{img.category}</span> : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{img.downloads}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(img.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => startEdit(img)}
                      className="text-amber-600 hover:text-amber-700 text-sm font-medium mr-3"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {images.length === 0 && (
            <div className="text-center py-12 text-gray-500">Нет изображений</div>
          )}
        </div>
      </div>
    </div>
  );
}
