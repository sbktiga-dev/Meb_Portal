'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { useRouter, useSearchParams } from 'next/navigation';
import Loading from '@/components/Loading';

interface Conversation {
  id: string;
  updatedAt: string;
  otherUser: { id: string; name: string | null; avatar: string | null; email: string } | null;
  lastMessage: { content: string; createdAt: string; author: { name: string | null } } | null;
  unread: number;
}

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    const targetUserId = searchParams.get('user');
    if (targetUserId) {
      fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: targetUserId }),
        signal: controller.signal,
      })
        .then(r => r.json())
        .then(data => {
          if (data.conversation?.id) {
            router.replace(`/dashboard/messages/${data.conversation.id}`);
          }
        })
        .catch(() => {});
      return () => controller.abort();
    }

    fetch('/api/conversations', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(r => r.json())
      .then(d => setConversations(d.conversations || []))
      .catch((err) => { if (err.name !== 'AbortError') setConversations([]); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [router, searchParams]);

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин.`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч.`;
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto">
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
            {conversations.map(conv => (
              <Link
                key={conv.id}
                href={`/dashboard/messages/${conv.id}`}
                className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {conv.otherUser?.avatar ? (
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 relative">
                    <Image src={conv.otherUser.avatar} alt={conv.otherUser.name || "Собеседник"} fill unoptimized sizes="48px" className="object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {conv.otherUser?.name?.charAt(0) || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-sm">{conv.otherUser?.name || 'Чат'}</span>
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-400">{getTimeAgo(conv.lastMessage.createdAt)}</span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-sm text-gray-500 truncate mt-0.5">{conv.lastMessage.content}</p>
                  )}
                </div>
                {conv.unread > 0 && (
                  <div className="w-5 h-5 bg-brand-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {conv.unread}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loading text="Загрузка..." /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
