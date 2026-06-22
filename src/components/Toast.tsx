'use client';

import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Toast({ message, type = 'info', onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-amber-600',
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${bgColors[type]} text-white px-6 py-3 rounded-xl shadow-lg transition-all`}>
      <div className="flex items-center gap-3">
        <span>{message}</span>
        <button onClick={() => { setVisible(false); onClose(); }} className="ml-2 hover:opacity-75">
          ✕
        </button>
      </div>
    </div>
  );
}
