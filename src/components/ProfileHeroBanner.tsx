'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

interface ProfileHeroBannerProps {
  banners: Banner[];
  theme?: string;
}

export default function ProfileHeroBanner({ banners, theme }: ProfileHeroBannerProps) {
  const heroBanners = banners.filter(b => b.position === 'hero' && b.active && b.imageUrl);
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % heroBanners.length);
  }, [heroBanners.length]);

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [heroBanners.length, next]);

  if (heroBanners.length === 0) {
    return null;
  }

  const banner = heroBanners[current];

  const content = (
    <div className="relative h-72 md:h-[420px] w-full overflow-hidden rounded-2xl">
      <Image src={banner.imageUrl} alt={banner.title || 'Баннер'} fill className="object-cover" sizes="100vw" unoptimized />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      {(banner.title || banner.subtitle) && (
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {banner.title && <h2 className="text-xl md:text-3xl font-bold text-white mb-1">{banner.title}</h2>}
            {banner.subtitle && <p className="text-sm md:text-base text-white/80">{banner.subtitle}</p>}
            {banner.linkUrl && (
              <Link href={banner.linkUrl} className="inline-block mt-3 bg-white/90 hover:bg-white text-gray-900 text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
                {banner.buttonText || 'Подробнее'}
              </Link>
            )}
          </div>
        </div>
      )}
      {heroBanners.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5">
          {heroBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Баннер ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-5' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (banner.linkUrl) {
    return <Link href={banner.linkUrl} className="block">{content}</Link>;
  }

  return content;
}
