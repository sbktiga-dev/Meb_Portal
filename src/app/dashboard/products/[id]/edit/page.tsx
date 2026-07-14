'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Loading from '@/components/Loading';
import toast from 'react-hot-toast';

const categories = ['Кухни', 'Шкафы', 'Столы', 'Стеллажи', 'Диваны', 'Кровати', 'Фурнитура', 'Материалы'];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [brand, setBrand] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    fetch(`/api/products/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.product) {
          setName(d.product.name);
          setDescription(d.product.description || '');
          setPrice(d.product.price?.toString() || '');
          setCategory(d.product.category);
          setBrand(d.product.brand || '');
          setImages(JSON.parse(d.product.images || '[]'));
          setIsPublished(d.product.isPublished);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setUploading(true);
    try {
      for (let i = 0; i < Math.min(files.length, 10 - images.length); i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          setImages(prev => [...prev, data.url]);
        }
      }
    } catch {}
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Введите название'); return; }

    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/products/manage', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.id,
          name: name.trim(),
          description: description.trim() || undefined,
          price: price ? parseFloat(price) : undefined,
          category,
          brand: brand.trim() || undefined,
          images,
          isPublished,
        }),
      });
      if (res.ok) {
        toast.success('Товар обновлён');
        router.push('/dashboard/products');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Ошибка');
      }
    } catch {}
    setSubmitting(false);
  };

  if (loading) return <Loading text="Загрузка товара..." />;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <div className="section-container py-10 md:py-14 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">Редактирование товара</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Изображения */}
          <div className="card-base p-5">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Фотографии</h2>
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <Image src={url} alt={`Фото ${i + 1}`} fill className="object-cover" unoptimized />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 transition-colors">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" multiple disabled={uploading} />
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
                      <span className="text-xs text-gray-400 mt-1">Добавить</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Основная информация */}
          <div className="card-base p-5">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Основная информация</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Название *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-premium w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Описание</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-premium w-full h-24 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Цена, ₽</label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="input-premium w-full" min="0" step="0.01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Категория *</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="input-premium w-full" required>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Бренд</label>
                <input type="text" value={brand} onChange={e => setBrand(e.target.value)} className="input-premium w-full" />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Опубликован</span>
                </label>
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex items-center gap-4">
            <button type="submit" disabled={submitting || !name.trim()} className="btn-primary disabled:opacity-50">
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-ghost">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
