'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { SkeletonGrid } from '@/components/Loading';
import Image from 'next/image';
import PageSEO from '@/components/PageSEO';

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  type: string;
  createdAt: string;
  owner: { id: string; name: string | null; avatar: string | null };
  _count: { members: number; posts: number };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', type: 'public' });
  const [creating, setCreating] = useState(false);

  const fetchGroups = useCallback(async (pageNum: number, append = false, signal?: AbortSignal) => {
    if (!append) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', String(pageNum));
      params.set('limit', '20');
      const res = await fetch(`/api/groups?${params}`, { signal });
      const data = await res.json();
      const newGroups = data.groups || [];
      if (append) {
        setGroups(prev => [...prev, ...newGroups]);
      } else {
        setGroups(newGroups);
      }
      setHasMore(pageNum < (data.pagination?.totalPages || 1));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (!append) setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    fetchGroups(1, false, controller.signal);
    return () => controller.abort();
  }, [fetchGroups]);

  const handleCreate = async () => {
    const token = localStorage.getItem('token');
    if (!token || !newGroup.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newGroup),
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(prev => [data.group, ...prev]);
        setShowCreate(false);
        setNewGroup({ name: '', description: '', type: 'public' });
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <PageSEO title="Группы" description="Группы мебельного сообщества на МебПортал: обсуждайте тренды, делитесь опытом и находите единомышленников в мебельной индустрии." />
      <div className="section-container py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Группы и сообщества</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Общайтесь с единомышленниками</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Создать группу
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-5 mb-8 animate-fade-in-up stagger-1">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Поиск групп..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="input-premium pl-11"
            />
          </div>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-float w-full max-w-md p-6 animate-scale-in">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Новая группа</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Название *</label>
                  <input
                    type="text"
                    value={newGroup.name}
                    onChange={e => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                    className="input-premium"
                    placeholder="Название группы"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Описание</label>
                  <textarea
                    value={newGroup.description}
                    onChange={e => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                    className="input-premium min-h-[80px]"
                    placeholder="О чём эта группа?"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Тип</label>
                  <select
                    value={newGroup.type}
                    onChange={e => setNewGroup(prev => ({ ...prev, type: e.target.value }))}
                    className="input-premium"
                  >
                    <option value="public">Публичная</option>
                    <option value="private">Приватная</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Отмена</button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !newGroup.name.trim()}
                  className="btn-primary flex-1"
                >
                  {creating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <SkeletonGrid count={6} />
        ) : groups.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Пока нет групп</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Создайте первую группу!</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">Создать группу</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, i) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className={`card-base overflow-hidden hover-lift animate-fade-in-up stagger-${Math.min((i % 6) + 1, 6)}`}
              >
                <div className="h-32 bg-gradient-to-br from-brand-100 via-orange-50 to-amber-50 relative">
                  {group.coverImage && (
                    <Image src={group.coverImage} alt="Обложка группы" fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" unoptimized />
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${group.type === 'public' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {group.type === 'public' ? 'Публичная' : 'Приватная'}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1 group-hover:text-brand-600 transition-colors">{group.name}</h3>
                  {group.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{group.description}</p>}
                  <div className="flex items-center justify-between text-sm text-gray-400 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                      {group._count.members} участников
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      {group._count.posts} постов
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
