'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
  fromUser: { id: string; name: string | null; avatar: string | null } | null;
}

const typeIcons: Record<string, string> = {
  like: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  comment: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  follow: 'M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12 7a4 4 0 110-8 4 4 0 010 8zM20 8v6M23 11h-6',
};

const typeColors: Record<string, string> = {
  like: 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400',
  comment: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400',
  follow: 'bg-brand-50 dark:bg-brand-500/10 text-brand-500 dark:text-brand-400',
};

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchUnread(controller.signal);
    const interval = setInterval(() => fetchUnread(), 30000);
    return () => { controller.abort(); clearInterval(interval); };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnread = async (signal?: AbortSignal) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/unread', {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      });
      const data = await res.json();
      setUnread(data.unread || 0);
    } catch {}
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=15', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {}
    setLoading(false);
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const markAsRead = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnread(prev => Math.max(0, prev - 1));
      }
    } catch {}
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) markAsRead(notification.id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-float border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-fade-in-down">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Уведомления</h3>
            {unread > 0 && (
              <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">{unread} новых</span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-brand-200 dark:border-brand-400 border-t-brand-500 dark:border-t-brand-400 rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500">Пока нет уведомлений</p>
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => handleNotificationClick(n)}
                      className={`flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.read ? 'bg-brand-50/30 dark:bg-brand-500/5' : ''}`}
                    >
                      <NotificationContent notification={n} />
                    </Link>
                  ) : (
                    <div
                      onClick={() => handleNotificationClick(n)}
                      className={`flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${!n.read ? 'bg-brand-50/30 dark:bg-brand-500/5' : ''}`}
                    >
                      <NotificationContent notification={n} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationContent({ notification }: { notification: Notification }) {
  const iconPath = typeIcons[notification.type] || typeIcons.like;
  const colorClass = typeColors[notification.type] || typeColors.like;
  const avatarColors = [
    'from-brand-400 to-orange-500',
    'from-emerald-400 to-teal-500',
    'from-purple-400 to-pink-500',
    'from-blue-400 to-indigo-500',
  ];
  const colorIdx = (notification.fromUser?.name?.charCodeAt(0) || 0) % avatarColors.length;

  return (
    <>
      <div className="flex-shrink-0 relative">
        {notification.fromUser?.avatar ? (
          <div className="w-10 h-10 rounded-full overflow-hidden relative">
            <Image src={notification.fromUser.avatar} alt="" fill unoptimized sizes="40px" className="object-cover" />
          </div>
        ) : notification.fromUser ? (
          <div className={`w-10 h-10 bg-gradient-to-br ${avatarColors[colorIdx]} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
            {notification.fromUser.name?.charAt(0) || '?'}
          </div>
        ) : (
          <div className={`w-10 h-10 ${colorClass} rounded-full flex items-center justify-center`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path d={iconPath} />
            </svg>
          </div>
        )}
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${colorClass} rounded-full flex items-center justify-center`}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path d={iconPath} />
          </svg>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${!notification.read ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
          {notification.message}
        </p>
        <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">{getTimeAgo(notification.createdAt)}</span>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-2" />
      )}
    </>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн. назад`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
