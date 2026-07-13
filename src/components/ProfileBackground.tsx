'use client';

import Image from 'next/image';

export const PROFILE_THEMES = [
  { id: 'default', label: 'Стандартная', gradient: 'from-brand-500 via-brand-600 to-orange-500', preview: 'bg-gradient-to-r from-brand-500 via-brand-600 to-orange-500' },
  { id: 'wood', label: 'Дерево', gradient: 'from-amber-800 via-amber-600 to-yellow-700', preview: 'bg-gradient-to-r from-amber-800 via-amber-600 to-yellow-700' },
  { id: 'forest', label: 'Лес', gradient: 'from-emerald-700 via-emerald-600 to-teal-500', preview: 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500' },
  { id: 'ocean', label: 'Океан', gradient: 'from-blue-600 via-blue-500 to-cyan-400', preview: 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400' },
  { id: 'sunset', label: 'Закат', gradient: 'from-rose-600 via-orange-500 to-amber-400', preview: 'bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400' },
  { id: 'night', label: 'Ночь', gradient: 'from-gray-800 via-gray-700 to-indigo-900', preview: 'bg-gradient-to-r from-gray-800 via-gray-700 to-indigo-900' },
  { id: 'minimalism', label: 'Минимализм', gradient: 'from-gray-200 via-gray-100 to-gray-50', preview: 'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-50' },
  { id: 'premium', label: 'Премиум', gradient: 'from-gray-900 via-gray-800 to-amber-900', preview: 'bg-gradient-to-r from-gray-900 via-gray-800 to-amber-900' },
] as const;

interface ProfileTheme {
  type: 'image' | 'gradient' | 'preset';
  value: string;
}

interface ProfileBackgroundProps {
  theme?: string;
  children?: React.ReactNode;
}

function getGradientClass(themeId: string): string {
  const theme = PROFILE_THEMES.find(t => t.id === themeId);
  return theme ? theme.gradient : PROFILE_THEMES[0].gradient;
}

export default function ProfileBackground({ theme, children }: ProfileBackgroundProps) {
  let parsed: ProfileTheme | null = null;
  try {
    parsed = theme ? JSON.parse(theme) : null;
  } catch {
    parsed = null;
  }

  if (parsed?.type === 'image' && parsed.value) {
    return (
      <div className="relative">
        <div className="absolute inset-0 h-40 md:h-64 overflow-hidden">
          <Image src={parsed.value} alt="" fill className="object-cover" sizes="100vw" unoptimized />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        {children}
      </div>
    );
  }

  const gradientId = parsed?.type === 'preset' ? parsed.value : 'default';
  const gradientClass = getGradientClass(gradientId);

  return (
    <div className={`bg-gradient-to-br ${gradientClass} relative`}>
      {children}
    </div>
  );
}
