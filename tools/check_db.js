const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const subs = await prisma.subscription.findMany({ include: { user: { select: { id: true, name: true, email: true, role: true } } }, orderBy: { createdAt: 'desc' } });
  console.log('SUBS:', JSON.stringify(subs, null, 2));
  const banners = await prisma.banner.findMany({ include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
  console.log('BANNERS:', JSON.stringify(banners, null, 2));
  const promos = await prisma.promotion.findMany({ include: { user: { select: { name: true } }, post: { select: { title: true } } }, orderBy: { createdAt: 'desc' } });
  console.log('PROMOS:', JSON.stringify(promos, null, 2));
  await prisma.$disconnect();
})();
