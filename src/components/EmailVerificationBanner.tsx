'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

export default function EmailVerificationBanner() {
  const { user, loading } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.emailVerified) {
      setDismissed(false);
    }
  }, [user?.emailVerified]);

  if (loading || !user || user.emailVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || 'Ошибка отправки');
      }
    } catch {
      setError('Ошибка сети');
    }
    setSending(false);
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-amber-800 dark:text-amber-200">
            {sent ? (
              'Письмо отправлено! Проверьте почту.'
            ) : (
              <>
                Подтвердите email для полного доступа.{' '}
                <button
                  onClick={handleResend}
                  disabled={sending}
                  className="underline font-medium hover:text-amber-900 dark:hover:text-amber-100 disabled:opacity-50"
                >
                  {sending ? 'Отправка...' : 'Отправить письмо'}
                </button>
              </>
            )}
          </span>
          {error && <span className="text-red-600 dark:text-red-400 text-xs ml-2">{error}</span>}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200 flex-shrink-0"
          aria-label="Закрыть"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
