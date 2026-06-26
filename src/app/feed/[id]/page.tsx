'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/components/Loading';

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; avatar: string | null };
}

interface PostData {
  id: string;
  title: string;
  content: string;
  category: string;
  images: string;
  tags: string;
  likes: number;
  views: number;
  createdAt: string;
  author: { id: string; name: string | null; avatar: string | null };
  comments: CommentData[];
  _count: { comments: number; likesList: number };
}

const categoryLabels: Record<string, { label: string; color: string; bg: string }> = {
  news: { label: 'Новость', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  project: { label: 'Проект', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
  article: { label: 'Статья', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
  product: { label: 'Товар', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
};

const avatarGradients = [
  'from-brand-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-purple-400 to-pink-500',
  'from-blue-400 to-indigo-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-red-500',
];

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => { if (d.user) setCurrentUserId(d.user.id); })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`/api/posts/${params.id}`, { headers });
        const data = await res.json();
        setPost(data.post);
        if (data.liked !== undefined) setLiked(data.liked);
      } catch { setPost(null); }
      finally { setLoading(false); }
    };
    fetchPost();
  }, [params.id]);

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const res = await fetch(`/api/posts/${params.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.liked);
        setPost(prev => prev ? { ...prev, likes: data.likes ?? (prev.likes + (data.liked ? 1 : -1)) } : prev);
      }
    } catch {}
  };

  const handleComment = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setPost(prev => prev ? { ...prev, comments: [data.comment, ...prev.comments], _count: { ...prev._count, comments: prev._count.comments + 1 } } : prev);
        setCommentText('');
      }
    } catch {}
    finally { setSubmitting(false); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <Loading text="Загрузка поста..." />;
  if (!post) return <div className="text-center py-20 text-gray-500">Пост не найден</div>;

  const tags: string[] = (() => { try { return JSON.parse(post.tags); } catch { return []; } })();
  const postImages: string[] = (() => { try { return JSON.parse(post.images); } catch { return []; } })();
  const cat = categoryLabels[post.category] || categoryLabels.news;
  const gradientIdx = (post.author.name?.charCodeAt(0) || 0) % avatarGradients.length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="section-container py-10 max-w-3xl">
        <button onClick={() => router.back()} className="btn-ghost mb-6 -ml-4 animate-fade-in">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 19l-7-7 7-7"/></svg>
          Назад к ленте
        </button>

        <article className="card-base overflow-hidden animate-fade-in-up stagger-1">
          {postImages.length > 0 && (
            <div className="relative bg-gray-100">
              {postImages.length === 1 ? (
                <div className="h-72 md:h-96 bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 relative overflow-hidden">
                  <img src={postImages[0]} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-0.5">
                  {postImages.slice(0, 4).map((img, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-brand-50 via-orange-50 to-amber-50 h-40 md:h-52 relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage(idx)}>
                      <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              )}
              {postImages.length > 4 && (
                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm font-semibold px-4 py-2 rounded-xl backdrop-blur-sm">
                  +{postImages.length - 4} фото
                </div>
              )}
              <div className="absolute top-4 left-4">
                <span className={`text-sm font-semibold px-3 py-1.5 rounded-lg border backdrop-blur-sm bg-white/90 ${cat.color}`}>{cat.label}</span>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-8">
            <div className="flex items-center gap-4 mb-6">
              {post.author.avatar ? (
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md">
                  <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className={`w-14 h-14 bg-gradient-to-br ${avatarGradients[gradientIdx]} rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md`}>
                  {post.author.name?.charAt(0) || '?'}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-lg">{post.author.name || 'Аноним'}</span>
              </div>
                <div className="text-sm text-gray-400">{new Date(post.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              {!postImages.length && (
                <span className={`text-sm font-semibold px-3 py-1.5 rounded-lg border ${cat.color} ${cat.bg}`}>{cat.label}</span>
              )}
              {currentUserId === post.author.id && (
                <Link href={`/feed/${post.id}/edit`}
                  className="text-sm font-medium text-brand-500 hover:text-brand-700 transition-colors flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  Редактировать
                </Link>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5 leading-tight">{post.title}</h1>

            <div className="prose prose-gray max-w-none mb-6">
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-base">{post.content}</p>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map(tag => <span key={tag} className="text-sm text-brand-600 bg-brand-50 px-3 py-1 rounded-full font-medium">#{tag}</span>)}
              </div>
            )}

            <div className="flex items-center gap-3 sm:gap-6 py-4 sm:py-5 border-y border-gray-100">
              <button onClick={handleLike} className={`flex items-center gap-2 text-sm font-semibold transition-all ${liked ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-red-500 hover:scale-105'}`}>
                <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                {post.likes}
              </button>
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                {post._count.comments}
              </span>
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                {post.views}
              </span>
              <button onClick={handleShare} className="ml-auto flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-brand-500 transition-colors">
                {copied ? (
                  <><svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Скопировано!</>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Поделиться</>
                )}
              </button>
            </div>
          </div>
        </article>

        <div className="mt-8 animate-fade-in-up stagger-2">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Комментарии ({post._count.comments})</h2>

          <div className="card-base p-6 mb-6">
            <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Напишите комментарий..."
              className="input-premium resize-none" rows={3} />
            <div className="flex justify-end mt-3">
              <button onClick={handleComment} disabled={submitting || !commentText.trim()} className="btn-primary !px-6 !py-2.5 text-sm">
                {submitting ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {post.comments.map((comment, i) => {
              const commentGradient = avatarGradients[(comment.author.name?.charCodeAt(0) || 0) % avatarGradients.length];
              return (
                <div key={comment.id} className={`card-base p-5 animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 bg-gradient-to-br ${commentGradient} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                      {comment.author.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 text-sm">{comment.author.name || 'Аноним'}</span>
                      <div className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed pl-0 sm:pl-12">{comment.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedImage !== null && postImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white z-10" onClick={() => setSelectedImage(null)}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div className="max-w-4xl w-full rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <img src={postImages[selectedImage]} alt="" className="w-full h-auto max-h-[80vh] object-contain" />
          </div>
          {postImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {postImages.map((_, idx) => (
                <button key={idx} onClick={(e) => { e.stopPropagation(); setSelectedImage(idx); }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${idx === selectedImage ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
