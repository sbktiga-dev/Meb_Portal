'use client';

import Link from 'next/link';

interface DocumentCardProps {
  id: string;
  title: string;
  category: string;
  fileType: string;
  downloads: number;
  description?: string | null;
}

const fileTypeIcons: Record<string, string> = {
  pdf: '📕',
  docx: '📘',
  doc: '📘',
  xlsx: '📗',
  xls: '📗',
  default: '📄',
};

export default function DocumentCard({ id, title, category, fileType, downloads, description }: DocumentCardProps) {
  const icon = fileTypeIcons[fileType.toLowerCase()] || fileTypeIcons.default;

  return (
    <Link href={`/documents/${id}`} className="block bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md p-5 hover:shadow-lg transition group">
      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-amber-600 transition">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{description}</p>
          )}
          <div className="flex items-center gap-3 text-sm">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs uppercase font-medium">{fileType}</span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg text-xs">{category}</span>
            <span className="text-gray-400">📥 {downloads}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
