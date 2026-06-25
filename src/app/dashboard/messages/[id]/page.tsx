'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; avatar: string | null };
}

interface OtherUser {
  id: string;
  name: string | null;
  avatar: string | null;
  email: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.user) setCurrentUserId(d.user.id); });

    fetch(`/api/conversations/${params.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.conversation) {
          const other = d.conversation.participants?.find((p: { user: { id: string } }) => p.user?.id !== d.conversation.participants.find((pp: { userId: string }) => true)?.userId);
          if (other?.user) setOtherUser(other.user);
        }
      })
      .catch(() => {});

    fetchMessages(token);
    const interval = setInterval(() => fetchMessages(token), 5000);
    return () => clearInterval(interval);
  }, [params.id, router]);

  useEffect(() => {
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    shouldAutoScroll.current = nearBottom;
  };

  const fetchMessages = async (token: string) => {
    try {
      const res = await fetch(`/api/conversations/${params.id}/messages?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch {} finally { setLoading(false); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${params.id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      }
    } catch {}
    setSending(false);
    inputRef.current?.focus();
  };

  const getTimeAgo = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <Loading text="Загрузка чата..." />;

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="section-container py-3 flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/messages')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          {otherUser?.avatar ? (
            <div className="w-9 h-9 rounded-full overflow-hidden">
              <img src={otherUser.avatar} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {otherUser?.name?.charAt(0) || '?'}
            </div>
          )}
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">{otherUser?.name || 'Чат'}</h2>
            <p className="text-xs text-gray-400">онлайн</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4" onScroll={handleScroll}>
        <div className="max-w-2xl mx-auto px-4 space-y-4">
          {messages.map((msg) => {
            const isMine = msg.author.id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMine ? 'order-2' : ''}`}>
                  {!isMine && (
                    <div className="flex items-center gap-2 mb-1">
                      {msg.author.avatar ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden">
                          <img src={msg.author.avatar} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-gradient-to-br from-brand-400 to-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                          {msg.author.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="text-xs text-gray-400">{msg.author.name}</span>
                    </div>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? 'bg-brand-500 text-white rounded-br-md'
                      : 'bg-white text-gray-900 border border-gray-100 shadow-sm rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                  <div className={`text-[10px] text-gray-400 mt-1 ${isMine ? 'text-right' : ''}`}>
                    {getTimeAgo(msg.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 sticky bottom-0">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Написать сообщение..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 focus:bg-white transition-all"
            autoFocus
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 bg-brand-500 text-white rounded-xl flex items-center justify-center hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
