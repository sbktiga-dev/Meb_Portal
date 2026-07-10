'use client';

import { useState, useEffect } from 'react';

interface DocumentData {
  id: string;
  title: string;
  category: string;
  fileType: string;
  downloads: number;
}

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }

    fetch('/api/documents?limit=100', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(res => res.json())
      .then(data => setDocs(data.documents || []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Управление документами</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Название</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Категория</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Формат</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Загрузки</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{doc.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{doc.category}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-xs uppercase">{doc.fileType}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{doc.downloads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
