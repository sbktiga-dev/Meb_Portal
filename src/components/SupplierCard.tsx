'use client';

import Link from 'next/link';

interface SupplierCardProps {
  id: string;
  companyName: string;
  description: string | null;
  categories: string[];
  isVerified: boolean;
  productCount?: number;
}

export default function SupplierCard({ id, companyName, description, categories, isVerified, productCount }: SupplierCardProps) {
  return (
    <Link href={`/suppliers/${id}`} className="block bg-gray-50 rounded-xl shadow-md p-6 hover:shadow-lg transition group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition">{companyName}</h3>
        {isVerified && (
          <span className="flex-shrink-0 px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
            ✓ Проверено
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{description}</p>
      )}
      <div className="flex flex-wrap gap-2 mb-3">
        {categories.map((cat) => (
          <span key={cat} className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-xs">{cat}</span>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm">
        {productCount !== undefined && (
          <span className="text-gray-500">📦 {productCount} товаров</span>
        )}
        <span className="text-amber-600 group-hover:text-amber-700 font-medium">Каталог →</span>
      </div>
    </Link>
  );
}
