'use client';

import { useState, useEffect } from 'react';

interface FollowButtonProps {
  userId: string;
  compact?: boolean;
}

export default function FollowButton({ userId, compact = false }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoggedIn(true);

    fetch(`/api/users/${userId}/follow-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setIsFollowing(data.isFollowing || false);
      })
      .catch(() => {});
  }, [userId]);

  const handleToggle = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setIsFollowing(data.followed);
      }
    } catch {}
    setLoading(false);
  };

  if (!isLoggedIn) return null;

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
          isFollowing
            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            : 'bg-brand-500 text-white hover:bg-brand-600'
        } disabled:opacity-50`}
      >
        {loading ? '...' : isFollowing ? 'Подписан' : 'Подписаться'}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        isFollowing
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
          : 'bg-brand-500 text-white hover:bg-brand-600 shadow-card'
      } disabled:opacity-50`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isFollowing ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      )}
      {isFollowing ? 'Подписан' : 'Подписаться'}
    </button>
  );
}
