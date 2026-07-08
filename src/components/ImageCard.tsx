'use client';

import Link from 'next/link';
import Image from 'next/image';

interface ImageCardProps {
  id: string;
  title: string;
  style?: string | null;
  category?: string | null;
  thumbnail?: string | null;
  downloads: number;
}

export default function ImageCard({ id, title, style, category, thumbnail, downloads }: ImageCardProps) {
  return (
    <Link href={`/gallery/${id}`} className="block bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition group">
      <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
            🖼️
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{title}</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {style && (
            <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-lg">{style}</span>
          )}
          {category && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">{category}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>📥 {downloads} загрузок</span>
          <span className="text-amber-600 group-hover:text-amber-700 font-medium">Подробнее →</span>
        </div>
      </div>
    </Link>
  );
}
