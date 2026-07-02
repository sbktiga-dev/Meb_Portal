'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SkeletonGrid } from '@/components/Loading';

interface EventData {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  type: string;
  maxParticipants: number | null;
  createdAt: string;
  organizer: { id: string; name: string | null; avatar: string | null };
  _count: { participants: number };
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '', description: '', location: '', startDate: '', endDate: '', type: 'offline', maxParticipants: '', coverImage: '',
  });
  const [creating, setCreating] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const fetchEvents = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await fetch(`/api/events?${params}`, { signal });
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    const controller = new AbortController();
    fetchEvents(controller.signal);
    return () => controller.abort();
  }, [fetchEvents]);

  useEffect(() => {
    if (!showCreate) return;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowCreate(false); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showCreate]);

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token || !newEvent.title.trim() || !newEvent.startDate) return;
    setCreating(true);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...newEvent,
          maxParticipants: newEvent.maxParticipants ? parseInt(newEvent.maxParticipants) : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/events/${data.event.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setNewEvent(p => ({ ...p, coverImage: data.url }));
      }
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="section-container py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">События и мероприятия</h1>
            <p className="text-gray-500 mt-1">Вебинары, встречи, выставки</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Создать событие
          </button>
        </div>

        <div className="flex gap-2 mb-8 animate-fade-in-up stagger-1">
          {[
            { key: 'all', label: 'Все' },
            { key: 'offline', label: 'Оффлайн' },
            { key: 'online', label: 'Онлайн' },
            { key: 'webinar', label: 'Вебинар' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                typeFilter === f.key
                  ? 'bg-brand-500 text-white shadow-card'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-float w-full max-w-lg p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Новое событие</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Название *</label>
                  <input type="text" value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} className="input-premium" placeholder="Название события" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Описание</label>
                  <textarea value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))} className="input-premium min-h-[80px]" placeholder="О чём событие?" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Обложка</label>
                  {newEvent.coverImage ? (
                    <div className="relative rounded-xl overflow-hidden h-40">
                      <img src={newEvent.coverImage} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setNewEvent(p => ({ ...p, coverImage: '' }))}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-400 transition-colors">
                      {uploadingCover ? (
                        <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          <span className="text-sm text-gray-400">Нажмите для загрузки</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                    </label>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Дата начала *</label>
                    <input type="datetime-local" value={newEvent.startDate} onChange={e => setNewEvent(p => ({ ...p, startDate: e.target.value }))} className="input-premium" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Дата окончания</label>
                    <input type="datetime-local" value={newEvent.endDate} onChange={e => setNewEvent(p => ({ ...p, endDate: e.target.value }))} className="input-premium" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Место</label>
                    <input type="text" value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} className="input-premium" placeholder="Адрес или ссылка" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Тип</label>
                    <select value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))} className="input-premium">
                      <option value="offline">Оффлайн</option>
                      <option value="online">Онлайн</option>
                      <option value="webinar">Вебинар</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Макс. участников</label>
                  <input type="number" value={newEvent.maxParticipants} onChange={e => setNewEvent(p => ({ ...p, maxParticipants: e.target.value }))} className="input-premium" placeholder="Без ограничений" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Отмена</button>
                <button onClick={handleCreate} disabled={creating || !newEvent.title.trim() || !newEvent.startDate} className="btn-primary flex-1">
                  {creating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <SkeletonGrid count={6} />
        ) : events.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Пока нет событий</h3>
            <p className="text-gray-500 mb-6">Создайте первое мероприятие!</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">Создать событие</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, i) => {
              const startDate = new Date(event.startDate);
              const isPast = startDate < new Date();
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className={`card-base overflow-hidden hover-lift animate-fade-in-up stagger-${Math.min((i % 6) + 1, 6)} ${isPast ? 'opacity-70' : ''}`}
                >
                  <div className="h-40 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-50 relative">
                    {event.coverImage && <img src={event.coverImage} alt="" className="w-full h-full object-cover" />}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        event.type === 'online' ? 'bg-blue-100 text-blue-700' :
                        event.type === 'webinar' ? 'bg-purple-100 text-purple-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {event.type === 'online' ? 'Онлайн' : event.type === 'webinar' ? 'Вебинар' : 'Оффлайн'}
                      </span>
                      {isPast && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Завершено</span>}
                    </div>
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                      <div className="text-2xl font-bold text-brand-600">{startDate.getDate()}</div>
                      <div className="text-xs text-gray-500 uppercase">{startDate.toLocaleDateString('ru-RU', { month: 'short' })}</div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{event.title}</h3>
                    {event.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{event.description}</p>}
                    <div className="space-y-1.5 text-sm text-gray-400">
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                          {event._count.participants}{event.maxParticipants ? `/${event.maxParticipants}` : ''} участников
                        </div>
                        <span>{startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
