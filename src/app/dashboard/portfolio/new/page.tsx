'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function NewPortfolioPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const MAX_IMAGES = 10;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { setError('Максимум 10 изображений'); return; }
    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const newImages: string[] = [];
      for (const file of toUpload) {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('token');
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          newImages.push(data.url);
        }
      }
      setImages(prev => [...prev, ...newImages]);
    } catch {}
    finally { setUploading(false); }
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    if (!title.trim()) { setError('Введите название работы'); return; }

    setSubmitting(true);
    setError('');
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null, category: category || null, tags, images }),
      });
      const data = await res.json();
      if (res.ok) { router.push('/dashboard/portfolio'); }
      else { setError(data.error || 'Ошибка'); }
    } catch { setError('Ошибка сети'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen">
      <div className="section-container py-10 max-w-2xl">
        <button onClick={() => router.back()} className="btn-ghost mb-6 -ml-4 animate-fade-in">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад
        </button>

        <div className="card-base p-5 sm:p-8 animate-fade-in-up stagger-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Добавить работу</h1>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Название работы *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Кухня в стиле минимализм"
                className="input-premium" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Опишите проект: материалы, размеры, особенности..."
                className="input-premium resize-none" rows={4} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Изображения</label>
              <div className="flex flex-wrap gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-brand-100">
                    <Image src={img} alt={`Изображение ${idx + 1}`} fill className="object-cover" sizes="96px" unoptimized />
                    <button type="button" onClick={() => removeImage(idx)} aria-label="Удалить изображение"
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-brand-400 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-brand-500 transition-colors">
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
                      <span className="text-[10px] font-medium">Добавить</span>
                    </>
                  )}
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              <p className="text-xs text-gray-400 mt-2">JPG, PNG, GIF, WebP. Макс. 10MB.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Категория</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'kitchen', label: 'Кухня' },
                  { key: 'bedroom', label: 'Спальня' },
                  { key: 'living', label: 'Гостиная' },
                  { key: 'office', label: 'Офис' },
                  { key: 'bathroom', label: 'Ванная' },
                  { key: 'wardrobe', label: 'Гардеробная' },
                  { key: 'other', label: 'Другое' },
                ].map(c => (
                  <button key={c.key} type="button" onClick={() => setCategory(category === c.key ? '' : c.key)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${category === c.key ? 'bg-brand-500 text-white shadow-card' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Теги <span className="text-gray-400 font-normal">(через запятую)</span></label>
              <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                placeholder="минимализм, белый, ЛДСП"
                className="input-premium" />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Добавить'}
              </button>
              <button type="button" onClick={() => router.back()} className="btn-ghost">Отмена</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
