'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface ReferralData {
  referralCode: string | null;
  referralCount: number;
  recentReferrals: {
    id: string;
    createdAt: string;
    referred: { id: string; name: string | null; email: string; createdAt: string };
  }[];
  appUrl: string;
}

export default function ReferralBanner() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/referral', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!data?.referralCode) return;
    const referralUrl = `${data.appUrl}/register?ref=${data.referralCode}`;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success('Реферальная ссылка скопирована!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Не удалось скопировать');
    }
  };

  if (loading || !data || !data.referralCode) return null;

  const referralUrl = `${data.appUrl}/register?ref=${data.referralCode}`;

  return (
    <div className="bg-gradient-to-r from-brand-500 to-orange-500 rounded-2xl p-6 text-white mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1">Пригласите коллегу на МебПортал</h3>
          <p className="text-white/80 text-sm mb-3">
            Делитесь ссылкой с коллегами в мебельной индустрии. Каждый приглашённый — рост сообщества!
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/20 rounded-lg px-4 py-2 text-sm font-mono truncate backdrop-blur-sm">
              {referralUrl}
            </div>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-white text-brand-600 rounded-lg font-medium text-sm hover:bg-white/90 transition-colors whitespace-nowrap"
            >
              {copied ? 'Скопировано!' : 'Копировать'}
            </button>
          </div>
        </div>
        <div className="text-center md:text-right">
          <div className="text-3xl font-bold">{data.referralCount}</div>
          <div className="text-white/70 text-sm">приглашённых</div>
        </div>
      </div>

      {data.recentReferrals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-white/60 text-xs mb-2">Последние приглашения:</p>
          <div className="flex flex-wrap gap-2">
            {data.recentReferrals.slice(0, 5).map(r => (
              <span key={r.id} className="bg-white/20 rounded-full px-3 py-1 text-xs backdrop-blur-sm">
                {r.referred.name || r.referred.email}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
