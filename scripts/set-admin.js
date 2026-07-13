const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { id: 'cmriyhzmh0001h35sk67giisz' },
    data: { role: 'ADMIN' },
    select: { id: true, email: true, name: true, role: true },
  });
  console.log(JSON.stringify(user));
}

main().finally(() => prisma.$disconnect());
