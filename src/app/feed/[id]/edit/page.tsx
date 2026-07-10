'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Loading from '@/components/Loading';
import Image from 'next/image';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('news');
  const [tagsInput, setTagsInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch(`/api/posts/${params.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.post) {
          setTitle(d.post.title);
          setContent(d.post.content);
          setCategory(d.post.category || 'news');
          try { setImages(JSON.parse(d.post.images)); } catch { setImages([]); }
          try { setTagsInput(JSON.parse(d.post.tags).join(', ')); } catch { setTagsInput(''); }
        }
      })
      .catch(() => setError('Пост не найден'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
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
    if (!title.trim() || !content.trim()) { setError('Заполните заголовок и содержание'); return; }

    setSubmitting(true);
    setError('');
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch(`/api/posts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), category, tags, images }),
      });
      const data = await res.json();
      if (res.ok) { router.push(`/feed/${params.id}`); }
      else { setError(data.error || 'Ошибка'); }
    } catch { setError('Ошибка сети'); }
    finally { setSubmitting(false); }
  };

  const categoryConfig = [
    { key: 'news', label: 'Новость', color: 'bg-blue-50 text-blue-600 border-blue-100', activeColor: 'bg-blue-500 text-white' },
    { key: 'project', label: 'Проект', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', activeColor: 'bg-emerald-500 text-white' },
    { key: 'article', label: 'Статья', color: 'bg-purple-50 text-purple-600 border-purple-100', activeColor: 'bg-purple-500 text-white' },
    { key: 'product', label: 'Товар', color: 'bg-amber-50 text-amber-600 border-amber-100', activeColor: 'bg-amber-500 text-white' },
  ];

  if (loading) return <Loading text="Загрузка..." />;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="section-container py-10 max-w-3xl">
        <button onClick={() => router.back()} className="btn-ghost mb-6 -ml-4 animate-fade-in">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад
        </button>

        <div className="card-base p-5 sm:p-8 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Редактировать пост</h1>
              <p className="text-sm text-gray-500">Обновите содержание публикации</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Категория</label>
              <div className="flex flex-wrap gap-2">
                {categoryConfig.map(c => (
                  <button key={c.key} type="button" onClick={() => setCategory(c.key)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${category === c.key ? c.activeColor + ' border-transparent shadow-card' : c.color + ' hover:opacity-80'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Заголовок</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="О чём ваш пост?"
                className="input-premium text-lg" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Содержание</label>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="Расскажите подробнее..."
                className="input-premium resize-none min-h-[200px]" rows={8} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Изображения</label>
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
              <p className="text-xs text-gray-400 mt-2">Макс. 10 фото. JPG, PNG, GIF.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Теги <span className="text-gray-400 font-normal">(через запятую)</span></label>
              <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                placeholder="мебель, кухня, проект"
                className="input-premium" />
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <button type="submit" disabled={submitting} className="btn-primary !px-8 !py-3">
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Сохранить'}
              </button>
              <button type="button" onClick={() => router.back()} className="btn-ghost">Отмена</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
