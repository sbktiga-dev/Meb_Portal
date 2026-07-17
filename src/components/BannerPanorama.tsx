import Link from 'next/link';
import Image from 'next/image';

interface BannerPanoramaProps {
  images: string[];
  title: string;
  linkUrl: string;
}

export default function BannerPanorama({ images, title, linkUrl }: BannerPanoramaProps) {
  const validImages = images.filter(Boolean).slice(0, 5);

  if (validImages.length === 0) return null;

  return (
    <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
      <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group cursor-pointer border border-gray-200 dark:border-gray-700">
        <div className="absolute top-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          Реклама
        </div>
        <div className="flex gap-1 p-1">
          {validImages.map((url, i) => (
            <div key={i} className="flex-1 relative aspect-[4/3] rounded-sm overflow-hidden bg-gray-200 dark:bg-gray-700">
              <Image
                src={url}
                alt={`${title} ${i + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 50vw, 20vw"
                unoptimized
              />
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
