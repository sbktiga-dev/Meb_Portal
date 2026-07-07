import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mebportal.online';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/feed`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/gallery`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/products`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/documents`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/refs`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/groups`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/events`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/specialists`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/suppliers`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/manufacturers`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/companies`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/help`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  try {
    const [posts, images, products, specialists, suppliers, manufacturers, companies, groups, events, documents] = await Promise.all([
      prisma.post.findMany({ select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 500 }),
      prisma.image.findMany({ select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 500 }),
      prisma.product.findMany({ select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 500 }),
      prisma.specialist.findMany({ select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 500 }),
      prisma.supplier.findMany({ select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 200 }),
      prisma.manufacturer.findMany({ select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 200 }),
      prisma.company.findMany({ select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 200 }),
      prisma.group.findMany({ select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 200 }),
      prisma.event.findMany({ select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 200 }),
      prisma.document.findMany({ select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 200 }),
    ]);

    const dynamicPages: MetadataRoute.Sitemap = [
      ...posts.map(p => ({ url: `${BASE_URL}/feed/${p.id}`, lastModified: p.createdAt, changeFrequency: 'monthly' as const, priority: 0.5 })),
      ...images.map(i => ({ url: `${BASE_URL}/gallery/${i.id}`, lastModified: i.createdAt, changeFrequency: 'monthly' as const, priority: 0.5 })),
      ...products.map(p => ({ url: `${BASE_URL}/products/${p.id}`, lastModified: p.createdAt, changeFrequency: 'monthly' as const, priority: 0.5 })),
      ...specialists.map(s => ({ url: `${BASE_URL}/specialists/${s.id}`, lastModified: s.createdAt, changeFrequency: 'monthly' as const, priority: 0.4 })),
      ...suppliers.map(s => ({ url: `${BASE_URL}/suppliers/${s.id}`, lastModified: s.createdAt, changeFrequency: 'monthly' as const, priority: 0.4 })),
      ...manufacturers.map(m => ({ url: `${BASE_URL}/manufacturers/${m.id}`, lastModified: m.createdAt, changeFrequency: 'monthly' as const, priority: 0.4 })),
      ...companies.map(c => ({ url: `${BASE_URL}/companies/${c.id}`, lastModified: c.createdAt, changeFrequency: 'monthly' as const, priority: 0.4 })),
      ...groups.map(g => ({ url: `${BASE_URL}/groups/${g.id}`, lastModified: g.createdAt, changeFrequency: 'monthly' as const, priority: 0.4 })),
      ...events.map(e => ({ url: `${BASE_URL}/events/${e.id}`, lastModified: e.createdAt, changeFrequency: 'monthly' as const, priority: 0.4 })),
      ...documents.map(d => ({ url: `${BASE_URL}/documents/${d.id}`, lastModified: d.createdAt, changeFrequency: 'monthly' as const, priority: 0.4 })),
    ];

    return [...staticPages, ...dynamicPages];
  } catch {
    return staticPages;
  }
}
