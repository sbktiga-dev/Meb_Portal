'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BannerPanoramaProps {
  images: string[];
  title: string;
  linkUrl: string;
}

export default function BannerPanorama({ images, title, linkUrl }: BannerPanoramaProps) {
  const validImages = images.filter(Boolean).slice(0, 5);
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % validImages.length);
  }, [validImages.length]);

  useEffect(() => {
    if (validImages.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, validImages.length]);

  if (validImages.length === 0) return null;

  if (validImages.length === 1) {
    return (
      <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
        <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group cursor-pointer border border-gray-200 dark:border-gray-700">
          <div className="relative aspect-[21/9]">
            <Image
              src={validImages[0]}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="100vw"
              unoptimized
            />
          </div>
          <div className="px-3 pb-2 pt-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-brand-600 transition-colors truncate">{title}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
      <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group cursor-pointer border border-gray-200 dark:border-gray-700">
        {/* Images */}
        <div className="relative aspect-[21/9]">
          {validImages.map((url, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-700 ease-in-out"
              style={{ opacity: i === current ? 1 : 0 }}
            >
              <Image
                src={url}
                alt={`${title} ${i + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
                unoptimized
              />
            </div>
          ))}
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
          <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors truncate">{title}</p>
        </div>

        {/* Dots */}
        {validImages.length > 1 && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
            {validImages.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === current
                    ? 'bg-white w-4'
                    : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
