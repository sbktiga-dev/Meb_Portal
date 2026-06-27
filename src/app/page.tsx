import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import HomeContent from '@/components/HomeContent';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function HomePage() {
  const [statsResult, images, documents, feedResult] = await Promise.all([
    prisma.$transaction([
      prisma.user.count(),
      prisma.image.count(),
      prisma.document.count(),
      prisma.supplier.count(),
      prisma.company.count(),
      prisma.specialist.count(),
    ]),
    prisma.image.findMany({
      take: 6,
      orderBy: { downloads: 'desc' },
      select: { id: true, title: true, url: true, style: true, category: true, downloads: true },
    }),
    prisma.document.findMany({
      take: 5,
      orderBy: { downloads: 'desc' },
      select: { id: true, title: true, category: true, fileType: true, downloads: true },
    }),
    prisma.post.findMany({
      take: 4,
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        _count: { select: { comments: true, likesList: true } },
      },
    }),
  ]);

  const [users, imagesCount, documentsCount, suppliers, companies, specialists] = statsResult;

  const stats = {
    users,
    images: imagesCount,
    documents: documentsCount,
    suppliers,
    companies,
    specialists,
  };

  const feedPosts = feedResult.map(p => ({
    ...p,
    author: { ...p.author },
    createdAt: p.createdAt.toISOString(),
  }));

  return <HomeContent stats={stats} images={images} documents={documents} feedPosts={feedPosts} />;
}
