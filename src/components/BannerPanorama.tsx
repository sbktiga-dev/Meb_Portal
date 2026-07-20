'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BannerPanoramaProps {
  images: string[];
  title: string;
  linkUrl: string;
}

export default function BannerPanorama({ images, title, linkUrl }: BannerPanoramaProps) {
  const validImages = images.filter(Boolean).slice(0, 5);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (validImages.length <= 1) return;
    const timer = setInterval(() => {
      setStep(prev => prev + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, [validImages.length]);

  if (validImages.length === 0) return null;

  const getImage = (slotIndex: number) => {
    return validImages[(slotIndex + step) % validImages.length];
  };

  return (
    <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
      <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group cursor-pointer border border-gray-200 dark:border-gray-700">
        <div className="flex gap-1 p-1">
          {validImages.map((_, i) => (
            <div key={i} className="flex-1 relative aspect-[4/3] rounded-sm overflow-hidden bg-gray-200 dark:bg-gray-700">
              <div
                className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                style={{ opacity: 1 }}
              >
                <Image
                  src={getImage(i)}
                  alt={`${title} ${i + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 50vw, 20vw"
                  unoptimized
                />
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 pb-2 pt-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-brand-600 transition-colors truncate">{title}</p>
        </div>
      </div>
    </Link>
  );
}
