'use client';

import { useEffect, useRef, ReactNode } from 'react';

interface InfiniteScrollProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  children?: ReactNode;
  loader?: ReactNode;
  endMessage?: ReactNode;
  threshold?: number;
}

export default function InfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  children,
  loader,
  endMessage,
  threshold = 200,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { rootMargin: `${threshold}px` }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore, threshold]);

  return (
    <>
      {children}
      <div ref={sentinelRef} className="py-8">
        {loading && (
          loader || (
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Загрузка ещё...</span>
            </div>
          )
        )}
        {!hasMore && !loading && (
          endMessage || (
            <p className="text-center text-sm text-gray-400">Все элементы загружены</p>
          )
        )}
      </div>
    </>
  );
}
