'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Страница не найдена</h2>
        <p className="text-gray-500 mb-6">Запрашиваемая страница не существует или была перемещена.</p>
        <Link href="/" className="btn-primary">На главную</Link>
      </div>
    </div>
  );
}
