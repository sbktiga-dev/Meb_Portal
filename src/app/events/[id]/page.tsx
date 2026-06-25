'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SkeletonPage } from '@/components/Loading';

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
  participants: { id: string; status: string; user: { id: string; name: string | null; avatar: string | null } }[];
  _count: { participants: number };
}

const avatarGradients = ['from-brand-400 to-orange-500', 'from-emerald-400 to-teal-500', 'from-purple-400 to-pink-500', 'from-blue-400 to-indigo-500'];

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);
  const [joining, setJoining] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${params.id}`);
      if (!res.ok) { router.push('/events'); return; }
      const data = await res.json();
      setEvent(data.event);

      const token = localStorage.getItem('token');
      if (token) {
        const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (meRes.ok) {
          const me = await meRes.json();
          setIsParticipant(data.event.participants.some((p: { user: { id: string } }) => p.user.id === me.user.id));
        }
      }
    } catch {
      router.push('/events');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  const handleJoin = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    setJoining(true);
    try {
      const res = await fetch(`/api/events/${params.id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return;
      setIsParticipant(data.joined);
      setEvent(prev => prev ? { ...prev, _count: { ...prev._count, participants: prev._count.participants + (data.joined ? 1 : -1) } } : prev);
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <SkeletonPage />;
  if (!event) return null;

  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isPast = startDate < new Date();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="section-container py-10">
        <Link href="/events" className="text-sm text-gray-400 hover:text-brand-500 transition-colors mb-6 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Все события
        </Link>

        <div className="card-base overflow-hidden mb-8 animate-fade-in">
          <div className="h-64 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-50 relative">
            {event.coverImage && <img src={event.coverImage} alt="" className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  event.type === 'online' ? 'bg-blue-500/80' :
                  event.type === 'webinar' ? 'bg-purple-500/80' :
                  'bg-green-500/80'
                }`}>
                  {event.type === 'online' ? 'Онлайн' : event.type === 'webinar' ? 'Вебинар' : 'Оффлайн'}
                </span>
                {isPast && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/80">Завершено</span>}
              </div>
              <h1 className="text-3xl font-bold">{event.title}</h1>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {event.description && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Описание</h2>
                    <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Участники ({event._count.participants})</h2>
                  <div className="flex flex-wrap gap-2">
                    {event.participants.slice(0, 20).map(p => {
                      const gradientIdx = (p.user.name?.charCodeAt(0) || 0) % avatarGradients.length;
                      return (
                        <div key={p.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                          {p.user.avatar ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden">
                              <img src={p.user.avatar} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className={`w-8 h-8 bg-gradient-to-br ${avatarGradients[gradientIdx]} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                              {p.user.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <span className="text-sm text-gray-700">{p.user.name || 'Аноним'}</span>
                          {p.status === 'organizer' && <span className="text-xs text-brand-600 font-medium">Организатор</span>}
                        </div>
                      );
                    })}
                    {event._count.participants > 20 && (
                      <span className="text-sm text-gray-400 self-center">+{event._count.participants - 20} ещё</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="card-base p-5 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    <div>
                      <div className="font-medium text-gray-900">{startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      <div className="text-gray-500">{startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}{endDate ? ` — ${endDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : ''}</div>
                    </div>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-3 text-sm">
                      <svg className="w-5 h-5 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      <span className="text-gray-700">{event.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-brand-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    <span className="text-gray-700">{event._count.participants}{event.maxParticipants ? `/${event.maxParticipants}` : ''} участников</span>
                  </div>

                  {!isPast && (
                    <button
                      onClick={handleJoin}
                      disabled={joining}
                      className={`w-full ${isParticipant ? 'btn-ghost border border-gray-200' : 'btn-primary'}`}
                    >
                      {joining ? '...' : isParticipant ? 'Отписаться' : 'Участвовать'}
                    </button>
                  )}
                </div>

                <div className="card-base p-5">
                  <div className="flex items-center gap-3">
                    {event.organizer.avatar ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <img src={event.organizer.avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 gradient-brand rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {event.organizer.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400">Организатор</p>
                      <p className="font-semibold text-gray-900 text-sm">{event.organizer.name || 'Аноним'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
