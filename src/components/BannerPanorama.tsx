'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface BannerPanoramaProps {
  images: string[];
  title: string;
  linkUrl: string;
}

function CrossfadeSlot({ urls, slotIndex }: { urls: string[]; slotIndex: number }) {
  const [idx, setIdx] = useState(slotIndex % urls.length);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (urls.length <= 1) return;
    const totalSlots = urls.length;
    const interval = totalSlots * 2000;

    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(prev => (prev + 1) % urls.length);
        setFading(false);
      }, 800);
    }, interval);

    // Stagger start per slot
    const delay = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        setIdx(prev => (prev + 1) % urls.length);
        setFading(false);
      }, 800);
    }, slotIndex * 2000);

    return () => { clearInterval(timer); clearTimeout(delay); };
  }, [urls.length, slotIndex]);

  const current = urls[idx];
  const nextIdx = (idx + 1) % urls.length;

  return (
    <div className="flex-1 relative aspect-[4/3] rounded-sm overflow-hidden bg-gray-200 dark:bg-gray-700">
      {/* Bottom layer — current image */}
      <Image
        src={current}
        alt={`${slotIndex + 1}`}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
        sizes="(max-width: 768px) 50vw, 20vw"
        unoptimized
      />
      {/* Top layer — next image fading in */}
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-in-out pointer-events-none"
        style={{ opacity: fading ? 1 : 0 }}
      >
        <Image
          src={urls[nextIdx]}
          alt={`${slotIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 20vw"
          unoptimized
        />
      </div>
    </div>
  );
}

export default function BannerPanorama({ images, title, linkUrl }: BannerPanoramaProps) {
  const validImages = images.filter(Boolean).slice(0, 5);

  if (validImages.length === 0) return null;

  return (
    <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
      <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group cursor-pointer border border-gray-200 dark:border-gray-700">
        <div className="flex gap-1 p-1">
          {validImages.map((_, i) => (
            <CrossfadeSlot key={i} urls={validImages} slotIndex={i} />
          ))}
        </div>
        <div className="px-3 pb-2 pt-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-brand-600 transition-colors truncate">{title}</p>
        </div>
      </div>
    </Link>
  );
}
