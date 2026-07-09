'use client';

import { useState } from 'react';

interface RefTableProps {
  id: string;
  title: string;
  description: string | null;
  category: string;
  content: Record<string, string[]>;
}

export default function RefTable({ title, description, category, content }: RefTableProps) {
  const [expanded, setExpanded] = useState(false);
  const keys = Object.keys(content);

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-xs">{category}</span>
            </div>
            {description && <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          <span className={`text-2xl text-gray-400 dark:text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {keys.map((key) => (
            <div key={key} className="mb-4 last:mb-0">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{key}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {content[key].length > 0 &&
                        content[key][0].split('|').map((header, i) => (
                          <th key={i} className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                            {header.trim()}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {content[key].slice(1).map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                        {row.split('|').map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-gray-700 dark:text-gray-300">
                            {cell.trim()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
