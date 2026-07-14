import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import CompaniesContent from './CompaniesContent';

export const metadata: Metadata = {
  title: 'Мебельные компании',
  description: 'Каталог мебельных компаний на МебПортал: производители, дизайнерские студии и мебельные фабрики. Найдите надёжного партнёра.',
  keywords: ['мебельные компании', 'мебельные фирмы', 'мебельные студии', 'производители мебели', 'мебельный бизнес'],
  openGraph: {
    title: 'Мебельные компании — МебПортал',
    description: 'Производители, дизайнерские студии и мебельные фабрики.',
    type: 'website',
    locale: 'ru_RU',
  },
};

export const dynamic = 'force-dynamic';

export default async function CompaniesPage({
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
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const orderBy = sort === 'verified'
    ? { isVerified: 'desc' as const }
    : sort === 'products'
      ? { name: 'asc' as const }
      : { createdAt: 'desc' as const };

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      take: 50,
      include: {
        _count: { select: { products: true } },
        users: { select: { id: true, name: true, avatar: true } },
      },
      orderBy,
    }),
    prisma.company.count({ where }),
  ]);

  const userIds = companies.flatMap(c => c.users.map(u => u.id));
  const proSubscriptions = await prisma.subscription.findMany({
    where: { userId: { in: userIds }, status: 'active', plan: { in: ['PRO', 'PREMIUM'] } },
    select: { userId: true, plan: true },
  });
  const proUserIds = new Set(proSubscriptions.map(s => s.userId));
  const premiumUserIds = new Set(proSubscriptions.filter(s => s.plan === 'PREMIUM').map(s => s.userId));

  const parsed = companies.map((c) => ({
    ...c,
    avatar: c.users?.[0]?.avatar || null,
    displayName: c.users?.[0]?.name || c.name,
    userId: c.users?.[0]?.id || null,
    isPro: c.users?.[0]?.id ? proUserIds.has(c.users[0].id) : false,
    isPremium: c.users?.[0]?.id ? premiumUserIds.has(c.users[0].id) : false,
  }));

  return (
    <CompaniesContent
      initialCompanies={parsed}
      total={total}
      initialCategory={category || 'Все'}
      initialSort={sort}
      initialSearch={search || ''}
    />
  );
}
