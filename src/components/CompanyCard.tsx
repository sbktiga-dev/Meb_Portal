'use client';

import Link from 'next/link';

interface CompanyCardProps {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  isVerified: boolean;
}

export default function CompanyCard({ id, name, description, address, phone, isVerified }: CompanyCardProps) {
  return (
    <Link href={`/companies/${id}`} className="block bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-amber-600 transition">{name}</h3>
        {isVerified && (
          <span className="flex-shrink-0 px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
            ✓ Проверено
          </span>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{description}</p>
      )}
      <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
        {address && (
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>{address}</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-2">
            <span>📞</span>
            <span>{phone}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
