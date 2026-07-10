'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Loading from '@/components/Loading';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function DashboardProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<{ id: string; email: string; name: string | null; role: string; inn: string | null; phone: string | null; avatar: string | null; cover: string | null; bio: string | null; location: string | null; website: string | null; socialLinks: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [inn, setInn] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setName(data.user.name || '');
          setPhone(data.user.phone || '');
          setInn(data.user.inn || '');
          setAvatar(data.user.avatar || null);
          setCover(data.user.cover || null);
          setBio(data.user.bio || '');
          setLocation(data.user.location || '');
          setWebsite(data.user.website || '');
          try { setSocialLinks(JSON.parse(data.user.socialLinks || '{}')); } catch { setSocialLinks({}); }
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
    return () => controller.abort();
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
        toast.success('Аватар загружен. Нажмите "Сохранить"');
      } else {
        toast.error(data.error || 'Ошибка загрузки');
      }
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
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
        setCover(data.url);
        toast.success('Обложка загружена. Нажмите "Сохранить"');
      } else {
        toast.error(data.error || 'Ошибка загрузки');
      }
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    try {
      const res = await fetch('/api/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone, inn, avatar, cover, bio, location, website, socialLinks: JSON.stringify(socialLinks) }),
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        toast.success('Профиль сохранён');
      } else {
        toast.error(data.error || 'Ошибка сохранения');
      }
    } catch {
      toast.error('Ошибка сети');
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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Профиль</h1>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 max-w-2xl">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="relative group">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="block"
                disabled={uploading}
              >
                {avatar ? (
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-3 border-brand-200 shadow-lg">
                    <Image src={avatar} alt="Аватар" fill className="object-cover" sizes="96px" unoptimized />
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
              <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{user?.name || 'Без имени'}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Нажмите на фото, чтобы загрузить аватар</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user?.email}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <p className="text-sm text-gray-500 dark:text-gray-400">Роль</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{roleLabels[user?.role || 'USER']}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-amber-600 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Телефон</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-amber-600 transition"
                placeholder="+7 (___) ___-__-__"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ИНН</label>
              <input
                type="text"
                value={inn}
                onChange={(e) => setInn(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-amber-600 transition"
                placeholder="ИНН для верификации"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">О себе</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-amber-600 transition resize-none"
                rows={3}
                placeholder="Расскажите о себе, своём опыте и специализации"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{bio.length}/500</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Город / Регион</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-amber-600 transition"
                  placeholder="Москва"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Вебсайт</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-amber-600 transition"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Обложка профиля</label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  {uploadingCover ? 'Загрузка...' : 'Загрузить обложку'}
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={uploadingCover} />
                </label>
                {cover && (
                  <div className="relative w-32 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <Image src={cover} alt="Обложка" fill className="object-cover" sizes="128px" unoptimized />
                    <button onClick={() => setCover(null)} aria-label="Удалить обложку" className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white text-xs hover:bg-black/70">×</button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Социальные сети</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'telegram', label: 'Telegram', placeholder: '@username' },
                  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+7 (999) 123-45-67' },
                  { key: 'vk', label: 'ВКонтакте', placeholder: 'https://vk.com/...' },
                  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/...' },
                ].map(s => (
                  <div key={s.key} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 w-20 shrink-0">{s.label}</span>
                    <input
                      type="text"
                      value={socialLinks[s.key] || ''}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, [s.key]: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:border-amber-600 transition"
                      placeholder={s.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
