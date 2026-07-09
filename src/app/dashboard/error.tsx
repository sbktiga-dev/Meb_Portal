'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Ошибка загрузки</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error.message || 'Не удалось загрузить данные'}</p>
        <button
          onClick={reset}
          className="bg-brand-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-600 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
