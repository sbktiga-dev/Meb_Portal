'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SkeletonFeed } from '@/components/Loading';
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
  members: { id: string; role: string; user: { id: string; name: string | null; avatar: string | null } }[];
  _count: { members: number; posts: number };
}

interface PostData {
  id: string;
  content: string;
  images: string;
  createdAt: string;
  author: { id: string; name: string | null; avatar: string | null };
}

const avatarGradients = [
  'from-brand-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-purple-400 to-pink-500',
  'from-blue-400 to-indigo-500',
];

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchGroup = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/groups/${params.id}`, { signal });
      if (!res.ok) { router.push('/groups'); return; }
      const data = await res.json();
      setGroup(data.group);

      const token = localStorage.getItem('token');
      if (token) {
        const meRes = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal });
        if (meRes.ok) {
          const me = await meRes.json();
          setIsMember(data.group.members.some((m: { user: { id: string } }) => m.user.id === me.user.id));
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      router.push('/groups');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  const fetchPosts = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/groups/${params.id}/posts`, { signal });
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {}
  }, [params.id]);

  useEffect(() => {
    const controller = new AbortController();
    fetchGroup(controller.signal);
    fetchPosts(controller.signal);
    return () => controller.abort();
  }, [fetchGroup, fetchPosts]);

  const handleJoin = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    setJoining(true);
    try {
      const res = await fetch(`/api/groups/${params.id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return;
      setIsMember(data.joined);
      setGroup(prev => prev ? { ...prev, _count: { ...prev._count, members: prev._count.members + (data.joined ? 1 : -1) } } : prev);
    } finally {
      setJoining(false);
    }
  };

  const handlePost = async () => {
    const token = localStorage.getItem('token');
    if (!token || !newPost.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/groups/${params.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newPost }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => [data.post, ...prev]);
        setNewPost('');
      }
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <SkeletonFeed count={2} />;
  if (!group) return null;

  const gradientIdx = (group.owner.name?.charCodeAt(0) || 0) % avatarGradients.length;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <PageSEO title={group.name || 'Группа'} description={group.description?.slice(0, 160) || `Группа на МебПортал: ${group.name}`} />
      <div className="section-container py-10">
        <Link href="/groups" className="text-sm text-gray-400 dark:text-gray-500 hover:text-brand-500 transition-colors mb-6 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Все группы
        </Link>

        <div className="card-base overflow-hidden mb-8 animate-fade-in">
          <div className="h-48 bg-gradient-to-br from-brand-100 via-orange-50 to-amber-50 relative">
            {group.coverImage && <Image src={group.coverImage} alt="Обложка группы" fill className="object-cover" sizes="(max-width: 768px) 100vw, 800px" unoptimized />}
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h1>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${group.type === 'public' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {group.type === 'public' ? 'Публичная' : 'Приватная'}
                  </span>
                </div>
                {group.description && <p className="text-gray-500 dark:text-gray-400 mt-2">{group.description}</p>}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-400 dark:text-gray-500">
                  <span>{group._count.members} участников</span>
                  <span>{group._count.posts} постов</span>
                  <span>Создана {new Date(group.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
              <button
                onClick={handleJoin}
                disabled={joining}
                className={isMember ? 'btn-ghost border border-gray-200 dark:border-gray-700' : 'btn-primary'}
              >
                {joining ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : isMember ? 'Покинуть' : 'Вступить'}
              </button>
            </div>
          </div>
        </div>

        {isMember && (
          <div className="card-base p-5 mb-8 animate-fade-in-up stagger-1">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                ?
              </div>
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  className="input-premium min-h-[80px] mb-3"
                  placeholder="Написать в группу..."
                />
                <div className="flex justify-end">
                  <button
                    onClick={handlePost}
                    disabled={posting || !newPost.trim()}
                    className="btn-primary"
                  >
                    {posting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Опубликовать'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p>Пока нет постов в группе</p>
            </div>
          ) : (
            posts.map((post, i) => {
              const postImages: string[] = (() => { try { return JSON.parse(post.images); } catch { return []; } })();
              const gradientIdx = (post.author.name?.charCodeAt(0) || 0) % avatarGradients.length;
              return (
                <div key={post.id} className={`card-base p-5 animate-fade-in-up stagger-${Math.min((i % 5) + 1, 6)}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {post.author.avatar ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-900 shadow-sm">
                          <Image src={post.author.avatar} alt={post.author.name || 'Аватар'} fill className="object-cover" sizes="40px" unoptimized />
                        </div>
                    ) : (
                      <div className={`w-10 h-10 bg-gradient-to-br ${avatarGradients[gradientIdx]} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                        {post.author.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{post.author.name || 'Аноним'}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{new Date(post.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
                  {postImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 mt-3 rounded-xl overflow-hidden">
                      {postImages.slice(0, 4).map((img, idx) => (
                          <div key={idx} className="relative" style={{ paddingBottom: '100%' }}>
                            <Image src={img} alt="Изображение поста" fill className="object-cover" sizes="(max-width: 640px) 50vw, 300px" unoptimized />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
