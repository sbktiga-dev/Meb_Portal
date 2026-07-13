'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { PROFILE_THEMES } from './ProfileBackground';
import toast from 'react-hot-toast';

interface ThemePickerProps {
  value: string;
  onChange: (theme: string) => void;
}

export default function ThemePicker({ value, onChange }: ThemePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  let parsed: { type: string; value: string } | null = null;
  try {
    parsed = value ? JSON.parse(value) : null;
  } catch {
    parsed = null;
  }

  const currentPreset = parsed?.type === 'preset' ? parsed.value : 'default';
  const currentImage = parsed?.type === 'image' ? parsed.value : null;

  const selectPreset = (id: string) => {
    onChange(JSON.stringify({ type: 'preset', value: id }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Максимальный размер 5 МБ');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        onChange(JSON.stringify({ type: 'image', value: data.url }));
        toast.success('Фон профиля обновлён');
      } else {
        toast.error(data.error || 'Ошибка загрузки');
      }
    } catch {
      toast.error('Ошибка сети');
    }
  };

  const resetToDefault = () => {
    onChange(JSON.stringify({ type: 'preset', value: 'default' }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Тема профиля</label>
        <button type="button" onClick={resetToDefault} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          Сбросить
        </button>
      </div>

      {/* Preset themes */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {PROFILE_THEMES.map(theme => (
          <button
            key={theme.id}
            type="button"
            onClick={() => selectPreset(theme.id)}
            className={`flex-shrink-0 w-16 h-10 rounded-lg ${theme.preview} border-2 transition-all ${
              currentPreset === theme.id && !currentImage
                ? 'border-amber-500 ring-2 ring-amber-200 dark:ring-amber-800'
                : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            title={theme.label}
          />
        ))}
      </div>

      {/* Image upload */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Своё изображение
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        {currentImage && (
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-6 rounded overflow-hidden border border-gray-200 dark:border-gray-700">
              <Image src={currentImage} alt="Фон" fill className="object-cover" sizes="40px" unoptimized />
            </div>
            <button type="button" onClick={() => selectPreset(currentPreset)} className="text-xs text-red-500 hover:text-red-600">
              Убрать
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
