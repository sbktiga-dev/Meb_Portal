import Link from 'next/link';
import Image from 'next/image';

interface BannerMiniProps {
  imageUrl: string;
  title: string;
  linkUrl: string;
}

export default function BannerMini({ imageUrl, title, linkUrl }: BannerMiniProps) {
  if (!imageUrl) return null;

  return (
    <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
      <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group cursor-pointer border border-gray-200 dark:border-gray-700 min-h-[160px]">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 25vw"
          unoptimized
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors truncate">{title}</p>
        </div>
      </div>
    </Link>
  );
}
