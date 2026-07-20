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
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (validImages.length <= 1) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setStep(prev => prev + 1);
        setFading(false);
      }, 1500);
    }, 10000);
    return () => clearInterval(timer);
  }, [validImages.length]);

  if (validImages.length === 0) return null;

  const getCurrent = (slotIndex: number) => validImages[(slotIndex + step) % validImages.length];
  const getNext = (slotIndex: number) => validImages[(slotIndex + step + 1) % validImages.length];

  return (
    <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
      <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group cursor-pointer border border-gray-200 dark:border-gray-700">
        <div className="flex gap-1 p-1">
          {validImages.map((_, i) => (
            <div key={i} className="flex-1 relative aspect-[4/3] rounded-sm overflow-hidden bg-gray-200 dark:bg-gray-700">
              {/* Bottom layer — current image */}
              <Image
                src={getCurrent(i)}
                alt={`${title} ${i + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 20vw"
                unoptimized
              />
              {/* Top layer — next image fading in */}
              <div
                className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out pointer-events-none"
                style={{ opacity: fading ? 1 : 0 }}
              >
                <Image
                  src={getNext(i)}
                  alt={`${title} ${i + 1}`}
                  fill
                  className="object-cover"
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
