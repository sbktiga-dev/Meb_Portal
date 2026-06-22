'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SendMessageButtonProps {
  userId: string;
  compact?: boolean;
}

export default function SendMessageButton({ userId, compact = false }: SendMessageButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok && data.conversation) {
        router.push(`/dashboard/messages/${data.conversation.id}`);
      }
    } catch {}
    setLoading(false);
  };

  if (compact) {
    return (
      <button onClick={handleClick} disabled={loading}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all disabled:opacity-50">
        {loading ? '...' : 'Написать'}
      </button>
    );
  }

  return (
    <button onClick={handleClick} disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition-all disabled:opacity-50">
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      )}
      Написать
    </button>
  );
}
