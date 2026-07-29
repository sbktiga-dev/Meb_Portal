'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number | null;
  images: string;
  category: string;
  isPublished: boolean;
  createdAt: string;
  _count: { reviews: number };
  boost?: { costPerClick: number; clicks: number; active: boolean } | null;
}

const categories = ['Кухонная мебель', 'Гостиная', 'Спальня', 'Прихожая', 'Детская', 'Кабинет', 'Ванная'];

export default function DashboardProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [boostModal, setBoostModal] = useState<Product | null>(null);
  const [boostCpc, setBoostCpc] = useState(5);
  const [boostBudget, setBoostBudget] = useState(100);
  const [boostSaving, setBoostSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    fetch('/api/products/manage', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить товар?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`/api/products/manage?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success('Товар удалён');
      }
    } catch {}
  };

  const togglePublished = async (product: Product) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/products/manage', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, isPublished: !product.isPublished }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isPublished: !p.isPublished } : p));
        toast.success(product.isPublished ? 'Снято с публикации' : 'Опубликовано');
      }
    } catch {}
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Цена не указана';
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const openBoost = (product: Product) => {
    setBoostModal(product);
    setBoostCpc(product.boost?.costPerClick || 5);
    setBoostBudget(100);
  };

  const handleBoost = async () => {
    if (!boostModal) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setBoostSaving(true);
    try {
      const res = await fetch(`/api/products/${boostModal.id}/boost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ costPerClick: boostCpc, budget: boostBudget }),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(prev => prev.map(p => p.id === boostModal.id ? { ...p, boost: data.boost } : p));
        toast.success('Буст активирован');
        setBoostModal(null);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Ошибка');
      }
    } catch { toast.error('Ошибка сети'); }
    finally { setBoostSaving(false); }
  };

  const handleStopBoost = async (productId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`/api/products/${productId}/boost`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, boost: null } : p));
      toast.success('Буст остановлен');
    } catch { toast.error('Ошибка'); }
  };

  if (loading) return <Loading text="Загрузка товаров..." />;

  return (
    <div className="flex min-h-screen bg-gray-50/50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 pb-4 md:pb-8 w-full min-w-0">
        <div className="section-container py-10 md:py-14">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Мои товары</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{products.length} товаров</p>
          </div>
          <Link href="/dashboard/products/new" className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Добавить товар
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Нет товаров</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Добавьте свой первый товар</p>
            <Link href="/dashboard/products/new" className="btn-primary">Добавить товар</Link>
          </div>
        ) : (
          <>
          {/* Мобильные карточки */}
          <div className="md:hidden space-y-3">
            {products.map(product => {
              const productImages: string[] = (() => { try { return JSON.parse(product.images); } catch { return []; } })();
              return (
                <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-card p-4">
                  <div className="flex gap-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                      {productImages[0] ? (
                        <Image src={productImages[0]} alt={product.name} fill className="object-cover" sizes="64px" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{product.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatPrice(product.price)}</span>
                        <span className="text-xs text-gray-400">· {product._count.reviews} отзывов</span>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePublished(product)}
                      className={`self-start px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0 ${product.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {product.isPublished ? 'Онлайн' : 'Черновик'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {product.boost?.active ? (
                      <button onClick={() => handleStopBoost(product.id)} className="flex-1 py-2 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg">↑ {product.boost.costPerClick}₽/клик</button>
                    ) : (
                      <button onClick={() => openBoost(product)} className="flex-1 py-2 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rounded-lg">↑ Поднять</button>
                    )}
                    <Link href={`/dashboard/products/${product.id}/edit`} className="flex-1 py-2 text-xs font-medium text-center bg-brand-50 text-brand-600 rounded-lg">Изменить</Link>
                    <button onClick={() => handleDelete(product.id)} className="py-2 px-3 text-xs font-medium bg-red-50 text-red-500 rounded-lg">✕</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Десктопная таблица */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Товар</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Категория</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Цена</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Отзывы</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Статус</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {products.map(product => {
                    const productImages: string[] = (() => { try { return JSON.parse(product.images); } catch { return []; } })();
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                              {productImages[0] ? (
                                <Image src={productImages[0]} alt={product.name} fill className="object-cover" sizes="48px" unoptimized />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{product.name}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(product.createdAt).toLocaleDateString('ru-RU')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="badge-neutral text-xs">{product.category}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatPrice(product.price)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {product._count.reviews}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => togglePublished(product)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              product.isPublished
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {product.isPublished ? 'Опубликован' : 'Черновик'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {product.boost?.active ? (
                              <button
                                onClick={() => handleStopBoost(product.id)}
                                className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg hover:bg-amber-200 transition-colors"
                                title="Остановить буст"
                              >
                                ↑ {product.boost.costPerClick}₽/клик
                              </button>
                            ) : (
                              <button
                                onClick={() => openBoost(product)}
                                className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rounded-lg hover:bg-brand-50 hover:text-brand-600 transition-colors"
                                title="Поднять в поиске"
                              >
                                ↑ Поднять
                              </button>
                            )}
                            <Link
                              href={`/dashboard/products/${product.id}/edit`}
                              className="p-2.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                              title="Редактировать"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </Link>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                              title="Удалить"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}
        </div>
      </div>

      {/* Boost Modal */}
      {boostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setBoostModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Поднять в поиске</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{boostModal.name}</p>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Ставка за клик: <span className="text-brand-600">{boostCpc} ₽</span>
              </label>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={boostCpc}
                onChange={e => setBoostCpc(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 ₽</span>
                <span>50 ₽</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Бюджет: <span className="text-brand-600">{boostBudget} ₽</span>
              </label>
              <input
                type="range"
                min={boostCpc}
                max={5000}
                step={boostCpc}
                value={boostBudget}
                onChange={e => setBoostBudget(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{boostCpc} ₽</span>
                <span>5 000 ₽</span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-5 text-sm">
              <p className="text-gray-600 dark:text-gray-400">Примерных показов: <span className="font-semibold text-gray-900 dark:text-gray-100">~{Math.floor(boostBudget / boostCpc)}</span></p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Товар будет показываться выше в каталоге, пока не израсходуется бюджет</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setBoostModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                Отмена
              </button>
              <button onClick={handleBoost} disabled={boostSaving} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition disabled:opacity-50">
                {boostSaving ? 'Сохранение...' : 'Активировать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
