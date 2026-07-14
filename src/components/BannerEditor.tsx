'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Banner {
  id: string;
  position: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  linkUrl?: string;
  buttonText?: string;
  active: boolean;
}

interface BannerEditorProps {
  banners: Banner[];
  onChange: (banners: Banner[]) => void;
  role: string;
}

const POSITIONS = [
  { key: 'hero', label: 'Главный баннер', icon: '★', max: 3 },
  { key: 'side', label: 'Боковые баннеры', icon: '◆', max: 10 },
  { key: 'content', label: 'Контентные баннеры', icon: '■', max: 10 },
];

const SIDE_SLOTS = ['side-1', 'side-2', 'side-3', 'side-4', 'side-5', 'side-6', 'side-7', 'side-8', 'side-9', 'side-10'];
const CONTENT_MAX = 10;

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function BannerEditor({ banners, onChange, role }: BannerEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const heroBanners = banners.filter(b => b.position === 'hero');
  const sideBanners = banners.filter(b => b.position.startsWith('side-'));
  const contentBanners = banners.filter(b => b.position.startsWith('content-'));

  const addHeroBanner = () => {
    if (heroBanners.length >= 3) {
      toast.error('Максимум 3 главных баннера');
      return;
    }
    const newBanner: Banner = {
      id: generateId(),
      position: 'hero',
      imageUrl: '',
      title: '',
      subtitle: '',
      linkUrl: '',
      buttonText: '',
      active: true,
    };
    onChange([...banners, newBanner]);
    setEditingId(newBanner.id);
  };

  const addSideBanner = (slot: string) => {
    const existing = banners.find(b => b.position === slot);
    if (existing) {
      setEditingId(existing.id);
      return;
    }
    const newBanner: Banner = {
      id: generateId(),
      position: slot,
      imageUrl: '',
      title: '',
      linkUrl: '',
      buttonText: '',
      active: true,
    };
    onChange([...banners, newBanner]);
    setEditingId(newBanner.id);
  };

  const addContentBanner = () => {
    if (contentBanners.length >= CONTENT_MAX) {
      toast.error('Максимум 10 контентных баннеров');
      return;
    }
    const idx = contentBanners.length + 1;
    const newBanner: Banner = {
      id: generateId(),
      position: `content-${idx}`,
      imageUrl: '',
      title: '',
      subtitle: '',
      linkUrl: '',
      buttonText: '',
      active: true,
    };
    onChange([...banners, newBanner]);
    setEditingId(newBanner.id);
  };

  const updateBanner = (id: string, updates: Partial<Banner>) => {
    onChange(banners.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBanner = (id: string) => {
    onChange(banners.filter(b => b.id !== id));
    setEditingId(null);
    toast.success('Баннер удалён');
  };

  const handleImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Максимальный размер 10 МБ');
      return;
    }
    setUploading(true);
    try {
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
        updateBanner(id, { imageUrl: data.url });
        toast.success('Изображение загружено');
      } else {
        toast.error(data.error || 'Ошибка загрузки');
      }
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setUploading(false);
    }
  };

  const editingBanner = editingId ? banners.find(b => b.id === editingId) : null;

  return (
    <div className="space-y-6">
      {/* Hero banners */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Главный баннер</h3>
          <button type="button" onClick={addHeroBanner} className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Добавить
          </button>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">Рекомендуемый формат: <strong>1920 x 600 px</strong> (3:1), JPG/PNG, до 5 МБ</p>
        {heroBanners.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">Нет главных баннеров. Нажмите «Добавить».</p>
        ) : (
          <div className="space-y-2">
            {heroBanners.map(banner => (
              <BannerCard key={banner.id} banner={banner} onEdit={() => setEditingId(banner.id)} onRemove={() => removeBanner(banner.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Side banners */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Боковые баннеры (5 слева + 5 справа)</h3>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">Рекомендуемый формат: <strong>500 x 400 px</strong> (4:3), JPG/PNG, до 5 МБ</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SIDE_SLOTS.map(slot => {
            const banner = sideBanners.find(b => b.position === slot);
            const sideLabel = parseInt(slot.split('-')[1]) <= 5 ? 'Л' : 'П';
            return (
              <button
                key={slot}
                type="button"
                onClick={() => banner ? setEditingId(banner.id) : addSideBanner(slot)}
                className={`relative rounded-xl border-2 overflow-hidden aspect-[4/3] transition-all ${
                  banner?.imageUrl
                    ? 'border-gray-200 dark:border-gray-700 hover:border-amber-400'
                    : 'border-dashed border-gray-200 dark:border-gray-700 hover:border-amber-300'
                }`}
              >
                {banner?.imageUrl ? (
                  <>
                    <Image src={banner.imageUrl} alt={banner.title || slot} fill className="object-cover" sizes="200px" unoptimized />
                    <div className="absolute top-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded">{sideLabel}</div>
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs font-medium opacity-0 hover:opacity-100">Редактировать</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-2">
                    <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{slot} ({sideLabel})</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content banners */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Контентные баннеры (внизу страницы)</h3>
          <button type="button" onClick={addContentBanner} className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Добавить
          </button>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">Рекомендуемый формат: <strong>1200 x 500 px</strong> (2.4:1), JPG/PNG, до 5 МБ</p>
        {contentBanners.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">Нет контентных баннеров. Нажмите «Добавить».</p>
        ) : (
          <div className="space-y-2">
            {contentBanners.map(banner => (
              <BannerCard key={banner.id} banner={banner} onEdit={() => setEditingId(banner.id)} onRemove={() => removeBanner(banner.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingBanner && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingId(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">
                {editingBanner.position === 'hero' ? 'Главный баннер' : editingBanner.position.startsWith('content-') ? 'Контентный баннер' : editingBanner.position}
              </h3>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Изображение</label>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2">
                  {editingBanner.position === 'hero' && 'Формат: 1920 x 600 px (3:1)'}
                  {editingBanner.position.startsWith('side-') && 'Формат: 500 x 400 px (4:3)'}
                  {editingBanner.position.startsWith('content-') && 'Формат: 1200 x 500 px (2.4:1)'}
                  {' · '}JPG или PNG, до 5 МБ
                </p>
                {editingBanner.imageUrl ? (
                  <div className="relative rounded-lg overflow-hidden aspect-video">
                    <Image src={editingBanner.imageUrl} alt="Превью" fill className="object-cover" sizes="400px" unoptimized />
                    <button
                      type="button"
                      onClick={() => updateBanner(editingBanner.id, { imageUrl: '' })}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/70"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(editingBanner.id, e)} className="hidden" />
                    <svg className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{uploading ? 'Загрузка...' : 'Нажмите для загрузки'}</p>
                  </label>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Заголовок</label>
                <input
                  type="text"
                  value={editingBanner.title}
                  onChange={e => updateBanner(editingBanner.id, { title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  placeholder="Скидка 20% на кухни"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Подзаголовок</label>
                <input
                  type="text"
                  value={editingBanner.subtitle || ''}
                  onChange={e => updateBanner(editingBanner.id, { subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  placeholder="Только до конца месяца"
                />
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ссылка</label>
                <input
                  type="url"
                  value={editingBanner.linkUrl || ''}
                  onChange={e => updateBanner(editingBanner.id, { linkUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  placeholder="https://example.com/promo"
                />
              </div>

              {/* Button text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Текст кнопки</label>
                <input
                  type="text"
                  value={editingBanner.buttonText || ''}
                  onChange={e => updateBanner(editingBanner.id, { buttonText: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  placeholder="Подробнее"
                />
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingBanner.active}
                  onChange={e => updateBanner(editingBanner.id, { active: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Активен</span>
              </label>
            </div>

            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setEditingId(null)} className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl font-medium hover:bg-amber-700 transition-colors text-sm">
                Готово
              </button>
              <button type="button" onClick={() => removeBanner(editingBanner.id)} className="px-4 py-2.5 text-red-500 hover:text-red-600 text-sm font-medium">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BannerCard({ banner, onEdit, onRemove }: { banner: Banner; onEdit: () => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-amber-300 transition-colors cursor-pointer" onClick={onEdit}>
      {banner.imageUrl ? (
        <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <Image src={banner.imageUrl} alt={banner.title || ''} fill className="object-cover" sizes="80px" unoptimized />
        </div>
      ) : (
        <div className="w-20 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{banner.title || 'Без заголовка'}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{banner.active ? 'Активен' : 'Неактивен'}</p>
      </div>
      <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }} className="text-gray-400 hover:text-red-500 p-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
      </button>
    </div>
  );
}
