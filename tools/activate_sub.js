const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const sub = await prisma.subscription.findFirst({
    where: { userId: 'cmriyhzmh0001h35sk67giisz', status: 'pending' },
    orderBy: { createdAt: 'desc' }
  });
  if (!sub) { console.log('No pending subscription found'); await prisma.$disconnect(); return; }
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 30);
  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'active', startDate: now, endDate: endDate }
  });
  console.log('ACTIVATED:', JSON.stringify(updated, null, 2));
  await prisma.$disconnect();
})();
