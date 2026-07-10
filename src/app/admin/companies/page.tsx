'use client';

import { useState, useEffect } from 'react';

interface CompanyData {
  id: string;
  name: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }

    Promise.all([
      fetch('/api/companies?limit=100', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }).then(r => r.json()),
      fetch('/api/suppliers?limit=100', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }).then(r => r.json()),
    ])
      .then(([companiesData, suppliersData]) => {
        const comps = (companiesData.companies || []).map((c: any) => ({ ...c, role: 'COMPANY' }));
        const supps = (suppliersData.suppliers || []).map((s: any) => ({ id: s.id, name: s.companyName, role: 'SUPPLIER', isVerified: s.isVerified, createdAt: s.createdAt }));
        setCompanies([...comps, ...supps]);
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Управление компаниями</h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Название</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Тип</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 font-medium">{c.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs">
                      {c.role === 'SUPPLIER' ? 'Поставщик' : 'Компания'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-xs ${c.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {c.isVerified ? 'Проверено' : 'Ожидает'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
