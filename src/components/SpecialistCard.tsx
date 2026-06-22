'use client';

import Link from 'next/link';

interface SpecialistCardProps {
  id: string;
  name: string;
  type: string;
  description: string | null;
  experience: number | null;
  rating: number;
}

const typeLabels: Record<string, string> = {
  MANAGER: 'Менеджер',
  DESIGNER: 'Дизайнер',
  TECHNOLOGIST: 'Технолог',
  INSTALLER: 'Установщик',
  OTHER: 'Другое',
};

export default function SpecialistCard({ id, name, type, description, experience, rating }: SpecialistCardProps) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <Link href={`/specialists/${id}`} className="block bg-gray-50 rounded-xl shadow-md p-6 hover:shadow-lg transition group">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition">{name}</h3>
            <span className="text-sm text-amber-600">★ {rating.toFixed(1)}</span>
          </div>
          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs mt-1">
            {typeLabels[type] || type}
          </span>
          {description && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{description}</p>
          )}
          {experience !== null && (
            <p className="text-sm text-gray-400 mt-2">Опыт: {experience} лет</p>
          )}
        </div>
      </div>
    </Link>
  );
}
