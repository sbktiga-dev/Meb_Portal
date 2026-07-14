import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import SuppliersContent from './SuppliersContent';

export const metadata: Metadata = {
  title: 'Поставщики мебельных материалов',
  description: 'Каталог поставщиков мебельных материалов и комплектующих на МебПортал: фурнитура, ЛДСП, техника, краски, стекло. Найдите надёжного поставщика для вашего производства.',
  keywords: ['поставщики мебели', 'фурнитура', 'ЛДСП', 'мебельные материалы', 'комплектующие для мебели', 'поставщики фурнитуры'],
  openGraph: {
    title: 'Поставщики мебельных материалов — МебПортал',
    description: 'Фурнитура, ЛДСП, техника, краски, стекло — каталог проверенных поставщиков для мебельного производства.',
    type: 'website',
    locale: 'ru_RU',
  },
};

export const dynamic = 'force-dynamic';

interface SupplierData {
  id: string;
  companyName: string;
  description: string | null;
  logo: string | null;
  avatar: string | null;
  displayName: string;
  userId: string | null;
  isPro: boolean;
  isPremium: boolean;
  categories: string;
  isVerified: boolean;
  phone: string | null;
  email: string | null;
  _count?: { products: number };
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; sort?: string };
}) {
  const category = searchParams.category;
  const search = searchParams.search;
  const sort = searchParams.sort || 'newest';

  const where: Record<string, unknown> = {};
  if (category && category !== 'Все') where.categories = { contains: category };
  if (search) {
    where.OR = [
      { companyName: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const orderBy = sort === 'verified'
    ? { isVerified: 'desc' as const }
    : sort === 'products'
      ? { companyName: 'asc' as const }
      : { createdAt: 'desc' as const };

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      take: 50,
      include: {
        _count: { select: { products: true } },
        users: { select: { id: true, name: true, avatar: true } },
      },
      orderBy,
    }),
    prisma.supplier.count({ where }),
  ]);

  const userIds = suppliers.flatMap(s => s.users.map(u => u.id));
  const proSubscriptions = await prisma.subscription.findMany({
    where: { userId: { in: userIds }, status: 'active', plan: { in: ['PRO', 'PREMIUM'] } },
    select: { userId: true, plan: true },
  });
  const proUserIds = new Set(proSubscriptions.map(s => s.userId));
  const premiumUserIds = new Set(proSubscriptions.filter(s => s.plan === 'PREMIUM').map(s => s.userId));

  const parsed: SupplierData[] = suppliers.map((s) => ({
    ...s,
    avatar: s.users?.[0]?.avatar || null,
    displayName: s.users?.[0]?.name || s.companyName,
    userId: s.users?.[0]?.id || null,
    isPro: s.users?.[0]?.id ? proUserIds.has(s.users[0].id) : false,
    isPremium: s.users?.[0]?.id ? premiumUserIds.has(s.users[0].id) : false,
  }));

  return (
    <SuppliersContent
      initialSuppliers={parsed}
      total={total}
      initialCategory={category || 'Все'}
      initialSort={sort}
      initialSearch={search || ''}
    />
  );
}
