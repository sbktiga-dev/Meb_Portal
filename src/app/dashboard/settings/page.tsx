'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Loading from '@/components/Loading';
import PushNotificationManager from '@/components/PushNotificationManager';
import FeedbackModal from '@/components/FeedbackModal';
import toast from 'react-hot-toast';

export default function DashboardSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; name: string | null; role: string; phone: string | null; inn: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [notifyDocs, setNotifyDocs] = useState(true);
  const [notifyImages, setNotifyImages] = useState(true);
  const [notifyNewsletter, setNotifyNewsletter] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

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
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [router]);

  if (loading) return <Loading />;

  const profileCompletion = (() => {
    if (!user) return 0;
    let completed = 0;
    let total = 3;
    if (user.name) completed++;
    if (user.phone) completed++;
    if (user.inn) completed++;
    return Math.round((completed / total) * 100);
  })();

  const handleChangePassword = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (newPassword !== confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Пароль изменён');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'Ошибка');
      }
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; max-age=0';
    router.push('/');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Вы уверены? Это действие необратимо.')) return;
    toast.error('Функция удаления аккаунта будет доступна позже');
  };

  const handleSaveNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setSavingPrefs(true);
    try {
      await fetch('/api/auth/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notificationPrefs: { notifyDocs, notifyImages, notifyNewsletter } }),
      });
    } catch {}
    setSavingPrefs(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Настройки</h1>

        <div className="space-y-6 max-w-2xl">
          {/* Профиль */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Профиль</h2>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${profileCompletion === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500">{profileCompletion}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {profileCompletion === 100
                ? 'Ваш профиль полностью заполнен!'
                : `Заполните профиль на ${100 - profileCompletion}% для полного доступа ко всем функциям`}
            </p>
            <div className="flex gap-3">
              <a href="/dashboard/profile" className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition">
                Редактировать профиль
              </a>
            </div>
          </div>

          {/* Изменение пароля */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Изменить пароль</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 transition"
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-amber-600 transition"
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition disabled:opacity-50"
                >
                  {saving ? 'Сохранение...' : 'Изменить пароль'}
                </button>
              </div>
            </div>
          </div>

          {/* Уведомления */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Уведомления</h2>
            <div className="space-y-3">
              <PushNotificationManager />
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700">Email-уведомления о новых документах</span>
                <input type="checkbox" checked={notifyDocs} onChange={e => setNotifyDocs(e.target.checked)} className="w-5 h-5 text-amber-600 rounded border-gray-300" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700">Уведомления о новых изображениях</span>
                <input type="checkbox" checked={notifyImages} onChange={e => setNotifyImages(e.target.checked)} className="w-5 h-5 text-amber-600 rounded border-gray-300" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700">Рассылка новостей платформы</span>
                <input type="checkbox" checked={notifyNewsletter} onChange={e => setNotifyNewsletter(e.target.checked)} className="w-5 h-5 text-amber-600 rounded border-gray-300" />
              </label>
            </div>
            <button onClick={handleSaveNotifications} disabled={savingPrefs} className="mt-4 btn-secondary text-sm">
              {savingPrefs ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>

          {/* Обратная связь */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Обратная связь</h2>
            <p className="text-gray-500 text-sm mb-4">Сообщите об ошибке или предложите улучшение</p>
            <button onClick={() => setFeedbackOpen(true)} className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              Написать нам
            </button>
          </div>

          {/* Опасная зона */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200">
            <h2 className="text-lg font-bold text-red-600 mb-2">Опасная зона</h2>
            <p className="text-gray-500 text-sm mb-4">Необратимые действия с вашим аккаунтом</p>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Выйти из аккаунта
              </button>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-50 text-red-600 px-6 py-2.5 rounded-xl font-medium hover:bg-red-100 transition"
              >
                Удалить аккаунт
              </button>
            </div>
          </div>
        </div>
      </div>
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
