import Link from 'next/link';
import Image from 'next/image';

interface BannerAdProps {
  title: string;
  imageUrl: string;
  linkUrl: string;
}

export default function BannerAd({ title, imageUrl, linkUrl }: BannerAdProps) {
  return (
    <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
      <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group cursor-pointer border border-gray-200 dark:border-gray-700 min-h-[160px] md:min-h-[337px]">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
        <div className="p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-brand-600 transition-colors">{title}</p>
        </div>
      </div>
    </Link>
  );
}
