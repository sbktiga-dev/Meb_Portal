'use client';

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center py-12">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка загрузки</h2>
        <p className="text-gray-500 mb-6">Не удалось загрузить данные. Попробуйте обновить страницу.</p>
        <button onClick={reset} className="btn-primary">Попробовать снова</button>
      </div>
    </div>
  );
}
