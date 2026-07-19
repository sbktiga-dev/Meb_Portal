'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import Sidebar from '@/components/Sidebar';
import Image from 'next/image';
import EmojiPicker from '@/components/EmojiPicker';
import MessageAttachments from '@/components/MessageAttachments';

interface Message {
  id: string;
  content: string;
  attachments: string;
  reactions: string;
  replyToId: string | null;
  createdAt: string;
  author: { id: string; name: string | null; avatar: string | null };
  replyTo?: Message | null;
}

interface OtherUser {
  id: string;
  name: string | null;
  avatar: string | null;
  email: string;
  lastActiveAt?: string | null;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '👀'];

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldAutoScroll = useRef(true);
  const prevMessageCount = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        if (d.user) setCurrentUserId(d.user.id);
      });

    fetch(`/api/conversations/${params.id}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        if (d.conversation) {
          const me = d.conversation.participants?.find((p: { userId: string }) => p.userId !== d.conversation.participants.find((pp: { userId: string }) => true)?.userId);
          const other = d.conversation.participants?.find((p: { userId: string }) => p.userId !== me?.userId);
          if (other?.user) setOtherUser(other.user);
        }
      })
      .catch(() => {});

    fetchMessages(token, controller.signal);
    const interval = setInterval(() => fetchMessages(token), 3000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [params.id, router]);

  useEffect(() => {
    // Only scroll to bottom if new messages arrived AND user was at bottom
    if (messages.length > prevMessageCount.current && shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    shouldAutoScroll.current = nearBottom;
  };

  const fetchMessages = async (token: string, signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/conversations/${params.id}/messages?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
        if (otherUser?.lastActiveAt) {
          const diff = Date.now() - new Date(otherUser.lastActiveAt).getTime();
          setOtherUserOnline(diff < 5 * 60 * 1000);
        }
      }
    } catch {} finally { setLoading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setUploading(true);
    try {
      for (let i = 0; i < Math.min(files.length, 5 - attachments.length); i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          setAttachments(prev => [...prev, data.url]);
        }
      }
    } catch {}
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0) || sending) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${params.id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          attachments: attachments.length > 0 ? attachments : undefined,
          replyToId: replyTo?.id || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        setAttachments([]);
        setReplyTo(null);
      }
    } catch {}
    setSending(false);
    inputRef.current?.focus();
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, reactions: JSON.stringify(data.reactions) } : m
        ));
      }
    } catch {}
    setShowReactions(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const getTimeAgo = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <Loading text="Загрузка чата..." />;

  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="section-container py-3 flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/messages')} aria-label="Назад к сообщениям" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="relative">
            {otherUser?.avatar ? (
              <div className="relative w-9 h-9 rounded-full overflow-hidden">
                <Image src={otherUser.avatar} alt={otherUser.name || 'Аватар'} fill className="object-cover" sizes="36px" unoptimized />
              </div>
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {otherUser?.name?.charAt(0) || '?'}
              </div>
            )}
            {otherUserOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{otherUser?.name || 'Чат'}</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {otherUserOnline ? 'онлайн' : 'не в сети'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4" onScroll={handleScroll}>
        <div className="max-w-2xl mx-auto px-4 space-y-4">
          {messages.map((msg) => {
            const isMine = msg.author.id === currentUserId;
            const parsedAttachments = msg.attachments ? JSON.parse(msg.attachments) : [];
            const parsedReactions = msg.reactions ? JSON.parse(msg.reactions) : {};

            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMine ? 'order-2' : ''}`}>
                  {!isMine && (
                    <div className="flex items-center gap-2 mb-1">
                      {msg.author.avatar ? (
                        <div className="relative w-6 h-6 rounded-full overflow-hidden">
                          <Image src={msg.author.avatar} alt={msg.author.name || 'Аватар'} fill className="object-cover" sizes="24px" unoptimized />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-gradient-to-br from-brand-400 to-orange-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                          {msg.author.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500">{msg.author.name}</span>
                    </div>
                  )}

                  {/* Reply preview */}
                  {msg.replyTo && (
                    <div className={`mb-1 px-3 py-1.5 rounded-lg text-xs ${isMine ? 'bg-brand-400/30 text-brand-100' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                      <span className="font-medium">{msg.replyTo.author?.name}</span>
                      <p className="truncate">{msg.replyTo.content || 'Вложение'}</p>
                    </div>
                  )}

                  <div
                    className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? 'bg-brand-500 text-white rounded-br-md'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 shadow-sm rounded-bl-md'
                    }`}
                    onMouseEnter={() => setShowReactions(msg.id)}
                    onMouseLeave={() => setShowReactions(null)}
                  >
                    {msg.content && <p>{msg.content}</p>}
                    <MessageAttachments attachments={parsedAttachments} />

                    {/* Quick reactions popup */}
                    {showReactions === msg.id && (
                      <div className={`absolute -top-10 ${isMine ? 'right-0' : 'left-0'} flex gap-1 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-2 py-1 z-20`}>
                        {QUICK_REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="text-lg hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reactions display */}
                  {Object.keys(parsedReactions).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                      {Object.entries(parsedReactions).map(([emoji, userIds]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(msg.id, emoji)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                            (userIds as string[]).includes(currentUserId || '')
                              ? 'bg-brand-50 border-brand-200 dark:bg-brand-900/30 dark:border-brand-700'
                              : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="text-gray-500 dark:text-gray-400">{(userIds as string[]).length}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={`flex items-center gap-2 mt-1 ${isMine ? 'justify-end' : ''}`}>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{getTimeAgo(msg.createdAt)}</span>
                    {!isMine && (
                      <button
                        onClick={() => setReplyTo(msg)}
                        className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        Ответить
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-2">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <div className="flex-1 min-w-0 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-brand-500">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{replyTo.author?.name}</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{replyTo.content || 'Вложение'}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 px-4 py-2">
          <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto">
            {attachments.map((url, i) => (
              <div key={i} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                <Image src={url} alt="Вложение" fill className="object-cover" unoptimized />
                <button
                  onClick={() => removeAttachment(i)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px]"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 sticky bottom-0">
        <form onSubmit={handleSend} className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || attachments.length >= 5}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-40"
            title="Прикрепить файл"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
            )}
          </button>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              placeholder="Написать сообщение..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 focus:bg-white dark:focus:bg-gray-600 transition-all text-gray-900 dark:text-gray-100"
            />
            {showEmojiPicker && (
              <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            title="Эмодзи"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </button>

          <button
            type="submit"
            disabled={(!newMessage.trim() && attachments.length === 0) || sending}
            aria-label="Отправить сообщение"
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
    </div>
  );
}
