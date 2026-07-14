import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import SpecialistsContent from './SpecialistsContent';

export const metadata: Metadata = {
  title: 'Мебельные специалисты',
  description: 'Каталог мебельных специалистов на МебПортал: дизайнеры, технологи, установщики и менеджеры. Найдите профессионала для вашего проекта.',
  keywords: ['мебельные специалисты', 'дизайнер мебели', 'технолог мебели', 'установщик мебели', 'мебельный менеджер'],
  openGraph: {
    title: 'Мебельные специалисты — МебПортал',
    description: 'Дизайнеры, технологи, установщики и менеджеры мебельной индустрии.',
    type: 'website',
    locale: 'ru_RU',
  },
};

export const dynamic = 'force-dynamic';

export default async function SpecialistsPage({
  searchParams,
}: {
  searchParams: { type?: string; search?: string; sort?: string };
}) {
  const type = searchParams.type;
  const search = searchParams.search;
  const sort = searchParams.sort || 'rating';

  const where: Record<string, unknown> = {};
  if (type && type !== 'Все') where.type = type;
  if (search) {
    where.OR = [
      { user: { name: { contains: search } } },
      { description: { contains: search } },
    ];
  }

  const orderBy = sort === 'experience'
    ? { experience: 'desc' as const }
    : sort === 'newest'
      ? { createdAt: 'desc' as const }
      : { rating: 'desc' as const };

  const specialists = await prisma.specialist.findMany({
    where,
    take: 50,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy,
  });

  return (
    <SpecialistsContent
      initialSpecialists={specialists}
      initialType={type || 'Все'}
      initialSort={sort}
      initialSearch={search || ''}
    />
  );
}
