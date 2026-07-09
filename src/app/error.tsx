'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">Ошибка</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">Что-то пошло не так</p>
        {error.message && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-8 max-w-md mx-auto">{error.message}</p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-brand-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-600 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
