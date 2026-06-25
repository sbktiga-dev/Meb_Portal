'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

interface Conversation {
  id: string;
  updatedAt: string;
  otherUser: { id: string; name: string | null; avatar: string | null; email: string } | null;
  lastMessage: { content: string; createdAt: string; author: { name: string | null } } | null;
  unread: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/conversations', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setConversations(d.conversations || []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, [router]);

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин.`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч.`;
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen">
      <div className="section-container py-10 max-w-3xl">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Сообщения</h1>
            <p className="text-gray-500 mt-1">Личные переписки</p>
          </div>
        </div>

        {loading ? (
          <Loading text="Загрузка..." />
        ) : conversations.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Пока нет диалогов</h3>
            <p className="text-gray-500">Начните общение с участниками портала</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv, i) => (
              <Link key={conv.id} href={`/dashboard/messages/${conv.id}`}
                className={`card-base flex items-center gap-4 p-4 hover-lift animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                {conv.otherUser?.avatar ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <img src={conv.otherUser.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {conv.otherUser?.name?.charAt(0) || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">{conv.otherUser?.name || 'Пользователь'}</h3>
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{getTimeAgo(conv.lastMessage.createdAt)}</span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">
                      {conv.lastMessage.author.name || 'Пользователь'}: {conv.lastMessage.content}
                    </p>
                  )}
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                    {conv.unread}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
