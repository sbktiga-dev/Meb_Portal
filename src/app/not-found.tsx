import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Страница не найдена</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-600 transition-colors"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
