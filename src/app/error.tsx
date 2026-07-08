'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">!</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Произошла ошибка</h2>
        <p className="text-gray-500 mb-6">Что-то пошло не так. Попробуйте обновить страницу.</p>
        <button onClick={reset} className="btn-primary">Попробовать снова</button>
      </div>
    </div>
  );
}
