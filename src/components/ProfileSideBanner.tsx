'use client';

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

interface ProfileSideBannerProps {
  banner?: Banner;
  position: string;
}

export default function ProfileSideBanner({ banner, position }: ProfileSideBannerProps) {
  const isFilled = banner?.active && banner?.imageUrl;

  if (!isFilled) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 flex flex-col items-center justify-center text-center min-h-[180px]">
        <svg className="w-6 h-6 text-gray-300 dark:text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 8v8M8 12h8" />
        </svg>
        <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500">Баннер свободен</p>
        <p className="text-[9px] text-gray-300 dark:text-gray-600 mt-0.5">Настройте в профиле</p>
      </div>
    );
  }

  const content = (
    <div className="relative rounded-xl overflow-hidden min-h-[180px] group cursor-pointer">
      <Image src={banner.imageUrl} alt={banner.title || 'Баннер'} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="256px" unoptimized />
      {(banner.title || banner.buttonText) && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3">
          {banner.title && <p className="text-white text-xs font-bold line-clamp-2">{banner.title}</p>}
          {banner.buttonText && (
            <span className="text-[10px] text-white/80 mt-1 underline">{banner.buttonText}</span>
          )}
        </div>
      )}
    </div>
  );

  if (banner.linkUrl) {
    return <Link href={banner.linkUrl} className="block">{content}</Link>;
  }

  return content;
}
