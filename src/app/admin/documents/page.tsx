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
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }

    fetch('/api/documents?limit=100', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setDocs(data.documents || []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Управление документами</h1>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Название</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Категория</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Формат</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Загрузки</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{doc.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doc.category}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs uppercase">{doc.fileType}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{doc.downloads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
