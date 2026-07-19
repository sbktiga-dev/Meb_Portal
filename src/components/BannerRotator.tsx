'use client';

import { useState, useEffect, useCallback } from 'react';
import BannerPanorama from './BannerPanorama';
import BannerMini from './BannerMini';

interface BannerItem {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  bannerType: string;
  images: string;
}

interface BannerRotatorProps {
  banners: BannerItem[];
  type: 'mini' | 'panorama';
  slots?: number;
  interval?: number;
  side?: 'left' | 'right';
}

function parseImages(imagesStr: string): string[] {
  try { return JSON.parse(imagesStr); } catch { return []; }
}

export default function BannerRotator({ banners, type, slots = 1, interval = 10000, side }: BannerRotatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeBanners = banners.filter(b => b.bannerType === type || (type === 'panorama' && b.bannerType === 'standard'));

  const nextPage = useCallback(() => {
    if (activeBanners.length <= slots) return;
    setCurrentIndex(prev => (prev + slots) % activeBanners.length);
  }, [activeBanners.length, slots]);

  useEffect(() => {
    if (activeBanners.length <= slots) return;
    const timer = setInterval(nextPage, interval);
    return () => clearInterval(timer);
  }, [activeBanners.length, slots, interval, nextPage]);

  if (activeBanners.length === 0) return null;

  // Show all if fits in slots
  const visibleBanners = activeBanners.length <= slots
    ? activeBanners
    : activeBanners.slice(currentIndex, currentIndex + slots).concat(
        activeBanners.slice(0, Math.max(0, currentIndex + slots - activeBanners.length))
      );

  return (
    <div className="relative">
      <div className={`transition-opacity duration-300`} key={currentIndex}>
        {type === 'panorama' ? (
          <div className="space-y-3">
            {visibleBanners.map(b => (
              <BannerPanorama
                key={b.id}
                images={parseImages(b.images)}
                title={b.title}
                linkUrl={b.linkUrl}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleBanners.map(b => {
              const imgs = parseImages(b.images);
              const imgUrl = side === 'right' && imgs[1] ? imgs[1] : (imgs[0] || b.imageUrl);
              return (
                <BannerMini
                  key={b.id}
                  imageUrl={imgUrl}
                  title={b.title}
                  linkUrl={b.linkUrl}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Dots indicator */}
      {activeBanners.length > slots && (
        <div className="flex justify-center gap-1.5 mt-3">
          {Array.from({ length: Math.ceil(activeBanners.length / slots) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i * slots)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                Math.floor(currentIndex / slots) === i
                  ? 'bg-brand-500 w-4'
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
