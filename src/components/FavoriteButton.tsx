'use client';

import { useState, useEffect } from 'react';

interface FavoriteButtonProps {
  itemType: 'image' | 'document' | 'product';
  itemId: string;
  compact?: boolean;
}

export default function FavoriteButton({ itemType, itemId, compact = false }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoggedIn(true);

    fetch(`/api/favorites?type=${itemType}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.favorites?.some((f: { itemId: string }) => f.itemId === itemId)) {
          setIsFavorited(true);
        }
      })
      .catch(() => {});
  }, [itemType, itemId]);

  const handleToggle = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemType, itemId }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsFavorited(data.favorited);
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
        className={`p-2 rounded-xl transition-all ${
          isFavorited
            ? 'text-amber-500 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20'
            : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:text-gray-500 dark:hover:bg-amber-500/10'
        } disabled:opacity-50`}
        title={isFavorited ? 'Убрать из избранного' : 'В избранное'}
        aria-label={isFavorited ? 'Убрать из избранного' : 'В избранное'}
      >
        <svg className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        isFavorited
          ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:hover:bg-amber-500/20'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:border-gray-600'
      } disabled:opacity-50`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
      {isFavorited ? 'В избранном' : 'В избранное'}
    </button>
  );
}
