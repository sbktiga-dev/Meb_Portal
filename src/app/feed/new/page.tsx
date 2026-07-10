'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PLAN_PREMIUM } from '@/lib/constants';

export default function NewPostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('news');
  const [tagsInput, setTagsInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [isProfilePromo, setIsProfilePromo] = useState(false);
  const [canCreatePromo, setCanCreatePromo] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/subscription/check', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setCanCreatePromo(d.plan === PLAN_PREMIUM))
        .catch(() => {});
    }
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 10 - images.length;
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
        } else {
          setError(data.error || 'Ошибка загрузки файла');
        }
      }
      setImages(prev => [...prev, ...newImages]);
    } catch (err) { setError('Ошибка сети при загрузке'); console.error('Upload error:', err); }
    finally { setUploading(false); }
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const extractVideoEmbed = (url: string): string | null => {
    const trimmed = url.trim();
    // Direct video files
    if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(trimmed)) return trimmed;
    // YouTube
    const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Rutube
    const rtMatch = trimmed.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)\//);
    if (rtMatch) return `https://rutube.ru/embed/${rtMatch[1]}`;
    // VK Video
    const vkMatch = trimmed.match(/vk\.com\/video(-?\d+_\d+)/);
    if (vkMatch) return `https://vk.com/video_ext.php?oid=${vkMatch[1].split('_')[0]}&id=${vkMatch[1].split('_')[1]}&hd=2`;
    return null;
  };

  const handleAddVideoUrl = () => {
    if (!videoUrl.trim()) return;
    const embed = extractVideoEmbed(videoUrl);
    if (!embed) { setError('Не удалось распознать ссылку. Поддерживаются: YouTube, Rutube, VK Video, прямые ссылки на MP4'); return; }
    if (images.length >= 10) { setError('Максимум 10 медиа'); return; }
    setImages(prev => [...prev, embed]);
    setVideoUrl('');
    setError('');
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
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), category, tags, images, isProfilePromo }),
      });
      const data = await res.json();
      if (res.ok) { router.push(`/feed/${data.post.id}`); }
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

  return (
    <div className="min-h-screen">
      <div className="section-container py-10 max-w-3xl">
        <button onClick={() => router.back()} className="btn-ghost mb-6 -ml-4 animate-fade-in">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад
        </button>

        <div className="card-base p-5 sm:p-8 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Новый пост</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Поделитесь новостями с сообществом</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Категория</label>
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Заголовок</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="О чём ваш пост?"
                className="input-premium text-lg" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Содержание</label>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="Расскажите подробнее..."
                className="input-premium resize-none min-h-[200px]" rows={8} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Медиа</label>
              <div className="flex flex-wrap gap-3">
                {images.map((img, idx) => {
                  const isEmbed = img.includes('youtube.com/embed') || img.includes('rutube.ru/embed') || img.includes('vk.com/video_ext');
                  const isVideo = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(img) || img.includes('video/') || isEmbed;
                  return (
                  <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-brand-50 to-orange-50 border-2 border-brand-100">
                    {isEmbed ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    ) : isVideo ? (
                      <video src={img} preload="metadata" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-brand-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                      </div>
                    )}
                    <button type="button" onClick={() => removeImage(idx)} aria-label="Удалить изображение"
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  );
                })}
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
              <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleImageUpload} className="hidden" />
              <p className="text-xs text-gray-400 mt-2">Макс. 10 файлов. JPG, PNG, GIF, MP4, WebM.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Видео по ссылке</label>
              <div className="flex gap-2">
                <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                  placeholder="YouTube, Rutube, VK Video или прямая ссылка на MP4"
                  className="input-premium flex-1" />
                <button type="button" onClick={handleAddVideoUrl}
                  className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors whitespace-nowrap">
                  Добавить
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Вставьте ссылку на видео с YouTube, Rutube, VK Video или прямую ссылку на MP4-файл</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Теги <span className="text-gray-400 dark:text-gray-500 font-normal">(через запятую)</span></label>
              <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                placeholder="мебель, кухня, проект"
                className="input-premium" />
            </div>

            {canCreatePromo && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isProfilePromo} onChange={e => setIsProfilePromo(e.target.checked)} className="w-5 h-5 text-amber-600 rounded border-gray-300 dark:border-gray-600 focus:ring-amber-500" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">Разместить как акцию на профиле</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Пост отобразится в разделе «Акции и спецпредложения» на вашем профиле</p>
                  </div>
                </label>
              </div>
            )}

            <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button type="submit" disabled={submitting} className="btn-primary !px-8 !py-3">
                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Опубликовать'}
              </button>
              <button type="button" onClick={() => router.back()} className="btn-ghost">Отмена</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
