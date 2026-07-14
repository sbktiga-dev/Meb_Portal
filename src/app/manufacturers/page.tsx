import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ManufacturersContent from './ManufacturersContent';

export const metadata: Metadata = {
  title: 'Мебельные производства',
  description: 'Каталог мебельных производств на МебПортал: фабрики, цеха и производственные компании. Надёжные партнёры для вашего бизнеса.',
  keywords: ['мебельное производство', 'мебельная фабрика', 'мебельный цех', 'производство мебели', 'мебельные компании'],
  openGraph: {
    title: 'Мебельные производства — МебПортал',
    description: 'Фабрики, цеха и производственные компании мебельной индустрии.',
    type: 'website',
    locale: 'ru_RU',
  },
};

export const dynamic = 'force-dynamic';

export default async function ManufacturersPage({
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

  const [manufacturers, total] = await Promise.all([
    prisma.manufacturer.findMany({
      where,
      take: 50,
      include: {
        users: { select: { id: true, name: true, avatar: true } },
      },
      orderBy,
    }),
    prisma.manufacturer.count({ where }),
  ]);

  const userIds = manufacturers.flatMap(m => m.users.map(u => u.id));
  const proSubscriptions = await prisma.subscription.findMany({
    where: { userId: { in: userIds }, status: 'active', plan: { in: ['PRO', 'PREMIUM'] } },
    select: { userId: true, plan: true },
  });
  const proUserIds = new Set(proSubscriptions.map(s => s.userId));
  const premiumUserIds = new Set(proSubscriptions.filter(s => s.plan === 'PREMIUM').map(s => s.userId));

  const parsed = manufacturers.map((m) => ({
    ...m,
    avatar: m.users?.[0]?.avatar || null,
    displayName: m.users?.[0]?.name || m.companyName,
    userId: m.users?.[0]?.id || null,
    isPro: m.users?.[0]?.id ? proUserIds.has(m.users[0].id) : false,
    isPremium: m.users?.[0]?.id ? premiumUserIds.has(m.users[0].id) : false,
  }));

  return (
    <ManufacturersContent
      initialManufacturers={parsed}
      total={total}
      initialCategory={category || 'Все'}
      initialSort={sort}
      initialSearch={search || ''}
    />
  );
}
