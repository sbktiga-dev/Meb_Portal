'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SkeletonProfile } from '@/components/Loading';
import { getDisplayName, getDisplayInitial } from '@/lib/displayName';
import FollowButton from '@/components/FollowButton';
import RoleBadge from '@/components/RoleBadge';
import ContactInfo from '@/components/ContactInfo';
import ReviewCard from '@/components/ReviewCard';
import ReviewForm from '@/components/ReviewForm';
import StarRating from '@/components/StarRating';
import InfiniteScroll from '@/components/InfiniteScroll';

interface ProfileData {
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    cover: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    role: string;
    inn: string | null;
    phone: string | null;
    socialLinks: string;
    interests: string;
    createdAt: string;
    _count: { posts: number; followers: number; following: number; portfolio: number };
  };
  specialist: { type: string; description: string | null; experience: number | null; rating: number } | null;
  company: { id: string; name: string; description: string | null; logo: string | null; website: string | null; isVerified: boolean } | null;
  supplier: { id: string; companyName: string; description: string | null; logo: string | null; website: string | null; categories: string; isVerified: boolean } | null;
  manufacturer: { id: string; name: string; description: string | null; logo: string | null; website: string | null; isVerified: boolean } | null;
  recentPosts: { id: string; title: string; category: string; images: string; likes: number; views: number; createdAt: string; _count: { comments: number } }[];
  recentPortfolio: { id: string; title: string; images: string; category: string | null; createdAt: string }[];
  reviewStats: { average: number | null; count: number };
}

interface Post { id: string; title: string; category: string; images: string; likes: number; views: number; createdAt: string; _count: { comments: number } }
interface PortfolioItem { id: string; title: string; images: string; category: string | null; createdAt: string }
interface Review { id: string; score: number; comment: string | null; createdAt: string; reviewer: { id: string; name: string | null; avatar: string | null; role: string } }

const roleLabels: Record<string, { label: string; color: string; icon: string }> = {
  USER: { label: 'Специалист', color: 'bg-purple-100 text-purple-700', icon: '✦' },
  COMPANY: { label: 'Компания', color: 'bg-blue-100 text-blue-700', icon: '◆' },
  SUPPLIER: { label: 'Поставщик', color: 'bg-emerald-100 text-emerald-700', icon: '●' },
  MANUFACTURER: { label: 'Производство', color: 'bg-amber-100 text-amber-700', icon: '■' },
  CLIENT: { label: 'Клиент', color: 'bg-gray-100 text-gray-700', icon: '○' },
};

const categoryLabels: Record<string, { label: string; color: string }> = {
  news: { label: 'Новость', color: 'text-blue-600 bg-blue-50' },
  project: { label: 'Проект', color: 'text-emerald-600 bg-emerald-50' },
  article: { label: 'Статья', color: 'text-purple-600 bg-purple-50' },
  product: { label: 'Товар', color: 'text-amber-600 bg-amber-50' },
};

const specialistTypes: Record<string, string> = {
  DESIGNER: 'Дизайнер',
  TECHNOLOGIST: 'Технолог',
  INSTALLER: 'Установщик',
  MANAGER: 'Менеджер',
};

const portfolioCategories = [
  { key: '', label: 'Все' },
  { key: 'kitchens', label: 'Кухни' },
  { key: 'wardrobes', label: 'Шкафы' },
  { key: 'tables', label: 'Столы' },
  { key: 'shelves', label: 'Полки' },
  { key: 'sofas', label: 'Диваны' },
  { key: 'beds', label: 'Кровати' },
  { key: 'other', label: 'Другое' },
];

const interestLabels: Record<string, string> = {
  kitchens: 'Кухни', wardrobes: 'Шкафы', tables: 'Столы', shelves: 'Полки',
  sofas: 'Диваны', beds: 'Кровати', hardware: 'Фурнитура', materials: 'Материалы',
  minimalism: 'Минимализм', classic: 'Классика', modern: 'Современный',
};

const avatarGradients = [
  'from-brand-400 to-orange-500', 'from-emerald-400 to-teal-500',
  'from-purple-400 to-pink-500', 'from-blue-400 to-indigo-500',
  'from-amber-400 to-orange-500', 'from-rose-400 to-red-500',
];

export default function ProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'portfolio' | 'reviews' | 'about'>('posts');

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);

  // Portfolio state
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioPage, setPortfolioPage] = useState(1);
  const [portfolioHasMore, setPortfolioHasMore] = useState(true);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioCategory, setPortfolioCategory] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<{ average: number | null; count: number }>({ average: null, count: 0 });
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsHasMore, setReviewsHasMore] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
        .then(r => r.json())
        .then(d => { if (d.user) setCurrentUserId(d.user.id); })
        .catch(() => {});
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${params.userId}/profile`, { signal: controller.signal });
        if (!res.ok) { setProfile(null); return; }
        const data = await res.json();
        setProfile(data);
        if (data.reviewStats) setReviewStats(data.reviewStats);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setProfile(null);
      } finally { setLoading(false); }
    };
    fetchProfile();
    return () => controller.abort();
  }, [params.userId]);

  // Fetch posts
  const fetchPosts = useCallback(async (page: number, append: boolean, signal?: AbortSignal) => {
    if (!profile) return;
    setPostsLoading(true);
    try {
      const res = await fetch(`/api/feed?authorId=${profile.user.id}&page=${page}&limit=10`, { signal });
      if (!res.ok) return;
      const data = await res.json();
      const items = data.items || data.posts || [];
      setPosts(prev => append ? [...prev, ...items] : items);
      setPostsHasMore(page < (data.pagination?.totalPages || 1));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally { setPostsLoading(false); }
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'posts' && posts.length === 0 && profile) {
      const c = new AbortController();
      fetchPosts(1, false, c.signal);
      return () => c.abort();
    }
  }, [activeTab, profile, fetchPosts, posts.length]);

  // Fetch portfolio
  const fetchPortfolio = useCallback(async (page: number, append: boolean, signal?: AbortSignal) => {
    if (!profile) return;
    setPortfolioLoading(true);
    try {
      const cat = portfolioCategory ? `&category=${portfolioCategory}` : '';
      const res = await fetch(`/api/portfolio/user/${profile.user.id}?page=${page}&limit=12${cat}`, { signal });
      if (!res.ok) return;
      const data = await res.json();
      const items = data.items || [];
      setPortfolioItems(prev => append ? [...prev, ...items] : items);
      setPortfolioHasMore(page < (data.pagination?.totalPages || 1));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally { setPortfolioLoading(false); }
  }, [profile, portfolioCategory]);

  useEffect(() => {
    if (activeTab === 'portfolio' && profile) {
      setPortfolioPage(1);
      setPortfolioHasMore(true);
      const c = new AbortController();
      fetchPortfolio(1, false, c.signal);
      return () => c.abort();
    }
  }, [activeTab, profile, portfolioCategory, fetchPortfolio]);

  // Fetch reviews
  const fetchReviews = useCallback(async (page: number, append: boolean, signal?: AbortSignal) => {
    if (!profile) return;
    setReviewsLoading(true);
    try {
      const res = await fetch(`/api/users/${profile.user.id}/reviews?page=${page}&limit=10`, { signal });
      if (!res.ok) return;
      const data = await res.json();
      setReviews(prev => append ? [...prev, ...data.items] : data.items);
      setReviewStats(data.stats);
      setReviewsHasMore(page < (data.pagination?.totalPages || 1));
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally { setReviewsLoading(false); }
  }, [profile]);

  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0 && profile) {
      const c = new AbortController();
      fetchReviews(1, false, c.signal);
      return () => c.abort();
    }
  }, [activeTab, profile, fetchReviews, reviews.length]);

  const loadMorePosts = useCallback(() => {
    const next = postsPage + 1;
    setPostsPage(next);
    fetchPosts(next, true);
  }, [postsPage, fetchPosts]);

  const loadMorePortfolio = useCallback(() => {
    const next = portfolioPage + 1;
    setPortfolioPage(next);
    fetchPortfolio(next, true);
  }, [portfolioPage, fetchPortfolio]);

  const loadMoreReviews = useCallback(() => {
    const next = reviewsPage + 1;
    setReviewsPage(next);
    fetchReviews(next, true);
  }, [reviewsPage, fetchReviews]);

  const handleReviewSuccess = () => {
    setReviews([]);
    setReviewsPage(1);
    const c = new AbortController();
    fetchReviews(1, false, c.signal);
  };

  if (loading) return <div className="min-h-screen bg-gray-50/50"><div className="max-w-4xl mx-auto px-4 py-12"><SkeletonProfile /></div></div>;
  if (!profile) return <div className="text-center py-20 text-gray-500">Пользователь не найден</div>;

  const { user, specialist, company, supplier, manufacturer } = profile;
  const roleInfo = roleLabels[user.role] || roleLabels.USER;
  const gradientIdx = (user.name?.charCodeAt(0) || 0) % avatarGradients.length;
  const socialLinks: Record<string, string> = (() => { try { return JSON.parse(user.socialLinks); } catch { return {}; } })();
  const interests: string[] = (() => { try { return JSON.parse(user.interests); } catch { return []; } })();
  const isOwnProfile = currentUserId === user.id;
  const joinDate = new Date(user.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 md:pb-0">
      {/* Cover + Avatar */}
      <div className="relative">
        <div className="h-40 md:h-64 bg-gradient-to-br from-brand-500 via-brand-600 to-orange-500 relative overflow-hidden">
          {user.cover && <Image src={user.cover} alt="" fill className="object-cover" sizes="100vw" unoptimized />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-14 md:-mt-16 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-4">
            <div className="relative flex-shrink-0">
              {user.avatar ? (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg relative">
                  <Image src={user.avatar} alt="" fill className="object-cover" sizes="128px" unoptimized />
                </div>
              ) : (
                <div className={`w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${avatarGradients[gradientIdx]} rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold border-4 border-white shadow-lg`}>
                  {getDisplayInitial(user.name, user.role)}
                </div>
              )}
              <RoleBadge role={user.role} size="lg" />
            </div>
            <div className="flex-1 pb-2 text-center sm:text-left">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{getDisplayName(user.name, user.role)}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleInfo.color}`}>
                  {roleInfo.icon} {roleInfo.label}
                </span>
                {specialist && <span className="text-xs text-gray-500">· {specialistTypes[specialist.type] || specialist.type}</span>}
                {(company?.isVerified || supplier?.isVerified || manufacturer?.isVerified) && (
                  <span className="text-xs text-blue-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                    Верифицирован
                  </span>
                )}
              </div>
              {user.bio && <p className="text-gray-600 mt-1.5 text-sm max-w-xl">{user.bio}</p>}
            </div>
            <div className="flex items-center gap-2 pb-2">
              {!isOwnProfile && currentUserId && (
                <>
                  <FollowButton userId={user.id} />
                  <Link href={`/dashboard/messages?user=${user.id}`} className="btn-ghost text-sm !px-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    Написать
                  </Link>
                </>
              )}
              {isOwnProfile && (
                <Link href="/dashboard/profile" className="btn-ghost text-sm">Редактировать</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
          {/* Left sidebar */}
          <div className="space-y-4 md:space-y-5">
            {/* Contacts */}
            <ContactInfo
              phone={currentUserId ? user.phone : null}
              website={user.website}
              location={user.location}
              socialLinks={socialLinks}
            />

            {/* Quick actions */}
            {!isOwnProfile && currentUserId && (
              <div className="card-base p-4 md:p-5 space-y-2">
                <h3 className="font-bold text-gray-900 text-sm">Действия</h3>
                <FollowButton userId={user.id} />
                <Link href={`/dashboard/messages?user=${user.id}`} className="flex items-center gap-2 w-full p-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  Написать сообщение
                </Link>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); }} className="flex items-center gap-2 w-full p-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                  Поделиться профилем
                </button>
              </div>
            )}

            {isOwnProfile && (
              <div className="card-base p-4 md:p-5 space-y-2">
                <h3 className="font-bold text-gray-900 text-sm">Действия</h3>
                <Link href="/dashboard/profile" className="flex items-center gap-2 w-full p-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  Редактировать профиль
                </Link>
                <Link href="/dashboard/portfolio/new" className="flex items-center gap-2 w-full p-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                  Добавить работу
                </Link>
                <Link href="/feed/new" className="flex items-center gap-2 w-full p-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  Написать пост
                </Link>
              </div>
            )}

            {/* Stats */}
            <div className="card-base p-4 md:p-5">
              <div className="grid grid-cols-2 gap-2.5 md:gap-3">
                <div className="text-center p-2.5 md:p-3 rounded-xl bg-gray-50">
                  <div className="text-lg md:text-xl font-bold text-gray-900">{user._count.posts}</div>
                  <div className="text-[11px] md:text-xs text-gray-500">Постов</div>
                </div>
                <div className="text-center p-2.5 md:p-3 rounded-xl bg-gray-50">
                  <div className="text-lg md:text-xl font-bold text-gray-900">{user._count.portfolio}</div>
                  <div className="text-[11px] md:text-xs text-gray-500">Портфолио</div>
                </div>
                <div className="text-center p-2.5 md:p-3 rounded-xl bg-gray-50">
                  <div className="text-lg md:text-xl font-bold text-gray-900">{user._count.followers}</div>
                  <div className="text-[11px] md:text-xs text-gray-500">Подписчиков</div>
                </div>
                <div className="text-center p-2.5 md:p-3 rounded-xl bg-gray-50">
                  <div className="text-lg md:text-xl font-bold text-gray-900">{user._count.following}</div>
                  <div className="text-[11px] md:text-xs text-gray-500">Подписок</div>
                </div>
                {reviewStats.count > 0 && (
                  <div className="col-span-2 text-center p-2.5 md:p-3 rounded-xl bg-amber-50">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg md:text-xl font-bold text-amber-600">{reviewStats.average?.toFixed(1) || '—'}</span>
                      <StarRating rating={reviewStats.average || 0} readonly size="sm" />
                    </div>
                    <div className="text-[11px] md:text-xs text-amber-500 mt-0.5">{reviewStats.count} отзывов</div>
                  </div>
                )}
              </div>
            </div>

            {/* Business info */}
            {company && (
              <div className="card-base p-4 md:p-5 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Компания</h3>
                <Link href={`/companies/${company.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  {company.logo ? (
                    <img src={company.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">К</div>
                  )}
                  <div>
                    <div className="font-medium text-sm text-gray-900">{company.name}</div>
                    {company.isVerified && <span className="text-xs text-blue-500">Верифицирована</span>}
                  </div>
                </Link>
                {company.description && <p className="text-xs text-gray-500 line-clamp-3">{company.description}</p>}
              </div>
            )}

            {supplier && (
              <div className="card-base p-4 md:p-5 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Поставщик</h3>
                <Link href={`/suppliers/${supplier.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  {supplier.logo ? (
                    <img src={supplier.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">П</div>
                  )}
                  <div>
                    <div className="font-medium text-sm text-gray-900">{supplier.companyName}</div>
                    {supplier.isVerified && <span className="text-xs text-blue-500">Верифицирован</span>}
                  </div>
                </Link>
                {supplier.description && <p className="text-xs text-gray-500 line-clamp-3">{supplier.description}</p>}
              </div>
            )}

            {manufacturer && (
              <div className="card-base p-4 md:p-5 space-y-3">
                <h3 className="font-bold text-gray-900 text-sm">Производство</h3>
                <Link href={`/manufacturers/${manufacturer.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  {manufacturer.logo ? (
                    <img src={manufacturer.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold">М</div>
                  )}
                  <div>
                    <div className="font-medium text-sm text-gray-900">{manufacturer.name}</div>
                    {manufacturer.isVerified && <span className="text-xs text-blue-500">Верифицировано</span>}
                  </div>
                </Link>
                {manufacturer.description && <p className="text-xs text-gray-500 line-clamp-3">{manufacturer.description}</p>}
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Tabs */}
            <div className="card-base p-1 flex gap-1 overflow-x-auto">
              {[
                { key: 'posts' as const, label: 'Публикации', count: user._count.posts },
                { key: 'portfolio' as const, label: 'Портфолио', count: user._count.portfolio },
                { key: 'reviews' as const, label: 'Отзывы', count: reviewStats.count },
                { key: 'about' as const, label: 'О себе', count: null },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && tab.count > 0 && <span className={`ml-1 text-[11px] ${activeTab === tab.key ? 'text-white/70' : 'text-gray-400'}`}>({tab.count})</span>}
                </button>
              ))}
            </div>

            {/* Tab: Posts */}
            {activeTab === 'posts' && (
              <InfiniteScroll hasMore={postsHasMore} loading={postsLoading} onLoadMore={loadMorePosts}>
                {posts.length > 0 ? (
                  <div className="space-y-3">
                    {posts.map(post => {
                      const postImages: string[] = (() => { try { return JSON.parse(post.images); } catch { return []; } })();
                      return (
                        <Link key={post.id} href={`/feed/${post.id}`} className="card-base block overflow-hidden hover:shadow-md transition-shadow">
                          <div className="p-4 sm:p-5">
                            <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">{post.title}</h4>
                            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${categoryLabels[post.category]?.color || 'text-gray-500'}`}>
                                {categoryLabels[post.category]?.label || post.category}
                              </span>
                              <span className="flex items-center gap-1">♥ {post.likes}</span>
                              <span className="flex items-center gap-1">👁 {post.views}</span>
                              <span className="flex items-center gap-1">💬 {post._count.comments}</span>
                              <span className="ml-auto text-xs">{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
                            </div>
                          </div>
                          {postImages.length > 0 && (
                            <div className="relative w-full" style={{ paddingBottom: '50%' }}>
                              <Image src={postImages[0]} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 500px" unoptimized />
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  !postsLoading && <div className="card-base p-10 text-center"><p className="text-gray-400">Пока нет публикаций</p></div>
                )}
              </InfiniteScroll>
            )}

            {/* Tab: Portfolio */}
            {activeTab === 'portfolio' && (
              <>
                {/* Category filter */}
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                  {portfolioCategories.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => { setPortfolioCategory(cat.key); setPortfolioItems([]); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        portfolioCategory === cat.key
                          ? 'bg-brand-500 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <InfiniteScroll hasMore={portfolioHasMore} loading={portfolioLoading} onLoadMore={loadMorePortfolio}>
                  {portfolioItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {portfolioItems.map(item => {
                        const imgs: string[] = (() => { try { return JSON.parse(item.images); } catch { return []; } })();
                        return (
                          <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                            {imgs[0] ? (
                              <img src={imgs[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                              <span className="text-white text-sm font-bold">{item.title}</span>
                              {item.category && <span className="text-white/70 text-xs">{item.category}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    !portfolioLoading && <div className="card-base p-10 text-center"><p className="text-gray-400">Пока нет работ в портфолио</p></div>
                  )}
                </InfiniteScroll>
              </>
            )}

            {/* Tab: Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {/* Review form */}
                {currentUserId && !isOwnProfile && (
                  <ReviewForm targetUserId={user.id} onSuccess={handleReviewSuccess} />
                )}

                {/* Reviews list */}
                <InfiniteScroll hasMore={reviewsHasMore} loading={reviewsLoading} onLoadMore={loadMoreReviews}>
                  {reviews.length > 0 ? (
                    <div className="space-y-3">
                      {reviews.map(review => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </div>
                  ) : (
                    !reviewsLoading && (
                      <div className="card-base p-10 text-center">
                        <p className="text-gray-400">Пока нет отзывов</p>
                        {currentUserId && !isOwnProfile && <p className="text-gray-400 text-sm mt-1">Будьте первым!</p>}
                      </div>
                    )
                  )}
                </InfiniteScroll>
              </div>
            )}

            {/* Tab: About */}
            {activeTab === 'about' && (
              <div className="space-y-4 md:space-y-5">
                {user.bio && (
                  <div className="card-base p-4 md:p-5">
                    <h3 className="font-bold text-gray-900 mb-2">О себе</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{user.bio}</p>
                  </div>
                )}

                {specialist && (
                  <div className="card-base p-4 md:p-5">
                    <h3 className="font-bold text-gray-900 mb-3">Опыт работы</h3>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="p-3 rounded-xl bg-purple-50 text-center">
                        <div className="text-lg md:text-2xl font-bold text-purple-600">{specialistTypes[specialist.type]}</div>
                        <div className="text-[11px] md:text-xs text-purple-500 mt-1">Специализация</div>
                      </div>
                      {specialist.experience != null && (
                        <div className="p-3 rounded-xl bg-blue-50 text-center">
                          <div className="text-lg md:text-2xl font-bold text-blue-600">{specialist.experience}+</div>
                          <div className="text-[11px] md:text-xs text-blue-500 mt-1">Лет опыта</div>
                        </div>
                      )}
                      <div className="p-3 rounded-xl bg-amber-50 text-center">
                        <div className="text-lg md:text-2xl font-bold text-amber-600">{specialist.rating.toFixed(1)}</div>
                        <div className="text-[11px] md:text-xs text-amber-500 mt-1">Рейтинг</div>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50 text-center">
                        <div className="text-lg md:text-2xl font-bold text-emerald-600">{user._count.followers}</div>
                        <div className="text-[11px] md:text-xs text-emerald-500 mt-1">Подписчиков</div>
                      </div>
                    </div>
                  </div>
                )}

                {interests.length > 0 && (
                  <div className="card-base p-4 md:p-5">
                    <h3 className="font-bold text-gray-900 mb-3">Интересы</h3>
                    <div className="flex flex-wrap gap-2">
                      {interests.map(interest => (
                        <span key={interest} className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-600 text-xs font-medium">
                          {interestLabels[interest] || interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="card-base p-4 md:p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Деятельность</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <span className="text-sm text-gray-600">Публикаций</span>
                      <span className="font-bold text-gray-900">{user._count.posts}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <span className="text-sm text-gray-600">Работ в портфолио</span>
                      <span className="font-bold text-gray-900">{user._count.portfolio}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <span className="text-sm text-gray-600">На портале с</span>
                      <span className="font-bold text-gray-900">{joinDate}</span>
                    </div>
                    {user.inn && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                        <span className="text-sm text-gray-600">ИНН</span>
                        <span className="font-bold text-gray-900">{user.inn}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
