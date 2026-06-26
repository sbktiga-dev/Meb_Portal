import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@mebportal.ru' } });
  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  const password = await bcrypt.hash('admin123', 12);
  await prisma.user.create({
    data: {
      email: 'admin@mebportal.ru',
      password,
      name: 'Администратор',
      role: 'ADMIN',
    },
  });
  console.log('Admin user created: admin@mebportal.ru / admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
