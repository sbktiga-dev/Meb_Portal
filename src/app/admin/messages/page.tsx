'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getDisplayName } from '@/lib/displayName';

interface Participant {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  role: string;
}

interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    author: { id: string; name: string | null; avatar: string | null };
  } | null;
  messageCount: number;
}

interface Message {
  id: string;
  content: string;
  attachments: string;
  createdAt: string;
  author: { id: string; name: string | null; avatar: string | null; role: string };
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.user?.role !== 'ADMIN') router.push('/dashboard'); })
      .catch(() => router.push('/login'));
  }, [router]);

  const loadConversations = async (pageNum = 1, searchQuery = search) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '20' });
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch(`/api/admin/messages?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (pageNum === 1) {
        setConversations(data.conversations || []);
      } else {
        setConversations(prev => [...prev, ...(data.conversations || [])]);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadConversations(1); }, []);

  const handleSearch = () => {
    setPage(1);
    loadConversations(1, search);
  };

  const loadMessages = async (convId: string) => {
    setMessagesLoading(true);
    setMessages([]);
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/messages/${convId}?limit=50`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMessages(data.messages || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { /* ignore */ }
    finally { setMessagesLoading(false); }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    loadMessages(conv.id);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'Админ', USER: 'Специалист', COMPANY: 'Компания',
    SUPPLIER: 'Поставщик', MANUFACTURER: 'Производство', CLIENT: 'Клиент',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Переписки пользователей</h1>

        <div className="flex gap-4 h-[calc(100vh-200px)]">
          {/* Sidebar — список диалогов */}
          <div className="w-full md:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col shrink-0">
            {/* Поиск */}
            <div className="p-3 border-b dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Поиск по имени или email..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <button onClick={handleSearch} className="px-3 py-2 bg-brand-500 text-white rounded-lg text-sm hover:bg-brand-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </div>
            </div>

            {/* Список */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>
              ) : conversations.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Нет диалогов</p>
              ) : (
                conversations.map(conv => {
                  const other = conv.participants.find(p => p.id !== selectedConv?.id) || conv.participants[0];
                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full text-left p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedConv?.id === conv.id ? 'bg-brand-50 dark:bg-brand-500/10' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {other?.avatar ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden relative">
                              <Image src={other.avatar} alt="" fill className="object-cover" sizes="40px" unoptimized />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {(other?.name || other?.email || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                              {conv.participants.map(p => p.name || p.email).join(' & ')}
                            </span>
                            <span className="text-xs text-gray-400 shrink-0 ml-2">
                              {conv.lastMessage ? formatDate(conv.lastMessage.createdAt) : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {conv.lastMessage
                                ? `${conv.lastMessage.author.name || 'Пользователь'}: ${conv.lastMessage.content}`
                                : 'Нет сообщений'}
                            </p>
                            <span className="text-xs text-gray-400 shrink-0 ml-2">{conv.messageCount} Сообщ.</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Область переписки */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col hidden md:flex">
            {!selectedConv ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <p className="text-sm">Выберите диалог для просмотра</p>
                </div>
              </div>
            ) : (
              <>
                {/* Шапка переписки */}
                <div className="p-4 border-b dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {selectedConv.participants.map(p => (
                        <div key={p.id} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden relative bg-gradient-to-br from-brand-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                          {p.avatar ? (
                            <Image src={p.avatar} alt="" fill className="object-cover" sizes="32px" unoptimized />
                          ) : (
                            (p.name || p.email).charAt(0).toUpperCase()
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {selectedConv.participants.map(p => `${p.name || p.email} (${roleLabels[p.role] || p.role})`).join(' и ')}
                      </p>
                      <p className="text-xs text-gray-400">{selectedConv.messageCount} сообщений</p>
                    </div>
                  </div>
                </div>

                {/* Сообщения */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-sm">Нет сообщений</p>
                  ) : (
                    messages.map(msg => {
                      const isOwn = false; // admin view — all messages look the same
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 relative bg-gradient-to-br from-brand-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                            {msg.author.avatar ? (
                              <Image src={msg.author.avatar} alt="" fill className="object-cover" sizes="32px" unoptimized />
                            ) : (
                              (msg.author.name || '?').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className={`max-w-[70%] ${isOwn ? 'text-right' : ''}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{msg.author.name || 'Пользователь'}</span>
                              <span className="text-[10px] text-gray-400">{new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className={`rounded-2xl px-4 py-2.5 text-sm ${isOwn ? 'bg-brand-500 text-white rounded-tr-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-sm'}`}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Метка админа */}
                <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-xs text-gray-400 text-center">Просмотр администратором. Отправка сообщений недоступна.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
