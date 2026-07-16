import Link from 'next/link';

interface BannerPlaceholderProps {
  text?: string;
  showLink?: boolean;
}

export default function BannerPlaceholder({ text = 'Место для баннера', showLink = true }: BannerPlaceholderProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 flex flex-col items-center justify-center text-center min-h-[337px]">
      <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{text}</p>
      {showLink && (
        <Link href="/dashboard/tariffs" className="mt-2 text-[10px] text-brand-500 hover:text-brand-600 font-medium underline underline-offset-2">
          Оформить подписку
        </Link>
      )}
    </div>
  );
}
