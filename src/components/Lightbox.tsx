'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface LightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export default function Lightbox({ images, initialIndex = 0, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const lastTouch = useRef<{ x: number; y: number; dist: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const resetTransform = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setScale(prev => Math.min(Math.max(prev + delta, 0.5), 4));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      resetTransform();
    } else {
      setScale(2.5);
    }
  }, [scale, resetTransform]);

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    cleanupRef.current?.();
    setDragging(true);
    const startX = e.clientX - pos.x;
    const startY = e.clientY - pos.y;
    const onMove = (ev: MouseEvent) => {
      setPos({ x: ev.clientX - startX, y: ev.clientY - startY });
    };
    const onUp = () => {
      setDragging(false);
      cleanupRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    cleanupRef.current = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [scale, pos]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouch.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: Math.sqrt(dx * dx + dy * dy),
      };
    } else if (e.touches.length === 1 && scale > 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouch.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scaleDelta = (dist - lastTouch.current.dist) * 0.008;
      setScale(prev => Math.min(Math.max(prev + scaleDelta, 0.5), 4));
      lastTouch.current.dist = dist;
    } else if (e.touches.length === 1 && scale > 1 && lastTouch.current) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      setPos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastTouch.current.x = e.touches[0].clientX;
      lastTouch.current.y = e.touches[0].clientY;
    }
  }, [scale]);

  const handleTouchEnd = useCallback(() => {
    lastTouch.current = null;
  }, []);

  const goPrev = useCallback(() => {
    resetTransform();
    setCurrent(prev => (prev - 1 + images.length) % images.length);
  }, [images.length, resetTransform]);

  const goNext = useCallback(() => {
    resetTransform();
    setCurrent(prev => (prev + 1) % images.length);
  }, [images.length, resetTransform]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === '+' || e.key === '=') setScale(prev => Math.min(prev + 0.25, 4));
      if (e.key === '-') setScale(prev => Math.max(prev - 0.25, 0.5));
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goPrev, goNext]);

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} aria-label="Закрыть" className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
      </button>

      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); goPrev(); }} aria-label="Предыдущее изображение" className="absolute left-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button onClick={(e) => { e.stopPropagation(); goNext(); }} aria-label="Следующее изображение" className="absolute right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
          </button>
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); resetTransform(); setCurrent(i); }}
                aria-label={i === current ? 'Текущее изображение' : `Изображение ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white scale-125' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
      )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 text-white/60 text-sm">
        <span>{current + 1} / {images.length}</span>
        <span className="text-white/40">•</span>
        <span>{Math.round(scale * 100)}%</span>
        <button onClick={(e) => { e.stopPropagation(); resetTransform(); }} aria-label="Сбросить масштаб" className="text-white/60 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
        </button>
      </div>

      <div
        ref={wheelRef}
        className="w-full h-full flex items-center justify-center p-4 md:p-16"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imgRef}
          src={images[current]}
          alt=""
          onDoubleClick={handleDoubleClick}
          className="max-w-full max-h-full object-contain select-none transition-transform duration-100"
          style={{
            transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
            cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
