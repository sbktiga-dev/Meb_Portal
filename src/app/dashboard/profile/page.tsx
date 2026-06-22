'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Loading from '@/components/Loading';

export default function DashboardProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<{ id: string; email: string; name: string | null; role: string; inn: string | null; phone: string | null; avatar: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [inn, setInn] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setName(data.user.name || '');
          setPhone(data.user.phone || '');
          setInn(data.user.inn || '');
          setAvatar(data.user.avatar || null);
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <Loading />;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setAvatar(data.url);
        setMessage('Аватар загружен. Нажмите "Сохранить"');
      } else {
        setMessage(data.error || 'Ошибка загрузки');
      }
    } catch {
      setMessage('Ошибка сети');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone, inn, avatar }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setMessage('Профиль сохранён');
      } else {
        setMessage(data.error || 'Ошибка сохранения');
      }
    } catch {
      setMessage('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    USER: 'Специалист',
    COMPANY: 'Компания / ИП',
    SUPPLIER: 'Поставщик',
    MANUFACTURER: 'Производство',
    ADMIN: 'Администратор',
  };

  const avatarColors = [
    'from-brand-400 to-orange-500',
    'from-emerald-400 to-teal-500',
    'from-purple-400 to-pink-500',
    'from-blue-400 to-indigo-500',
    'from-amber-400 to-orange-500',
    'from-rose-400 to-red-500',
  ];
  const colorIdx = (user?.name?.charCodeAt(0) || 0) % avatarColors.length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Профиль</h1>

        <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-xl">
            <div className="relative group">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="block"
                disabled={uploading}
              >
                {avatar ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-3 border-brand-200 shadow-lg">
                    <img src={avatar} alt="Аватар" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-24 h-24 bg-gradient-to-br ${avatarColors[colorIdx]} rounded-2xl flex items-center justify-center text-white text-3xl font-bold border-3 border-white shadow-lg`}>
                    {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploading ? (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <circle cx="12" cy="13" r="3"/>
                    </svg>
                  )}
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{user?.name || 'Без имени'}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">Нажмите на фото, чтобы загрузить аватар</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Роль</p>
              <p className="font-medium text-gray-900">{roleLabels[user?.role || 'USER']}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 transition"
                placeholder="+7 (___) ___-__-__"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ИНН</label>
              <input
                type="text"
                value={inn}
                onChange={(e) => setInn(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 transition"
                placeholder="ИНН для верификации"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
              {message && <span className="text-sm text-green-600">{message}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
