const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Специалисты, у которых пользователь уже не USER/SPECIALIST
  const orphanSpecialists = await prisma.specialist.findMany({
    where: { user: { role: { notIn: ['USER', 'SPECIALIST'] } } },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  });
  console.log('Orphan specialists:', orphanSpecialists.length);
  for (const s of orphanSpecialists) {
    if (!s.user) continue;
    console.log(' -', s.user.email, 'role:', s.user.role, 'specialistId:', s.id);
    await prisma.user.update({ where: { id: s.user.id }, data: { specialistId: null } });
    await prisma.specialist.delete({ where: { id: s.id } });
    console.log('   -> cleaned up');
  }

  // Поставщики, у которых нет пользователя с ролью SUPPLIER
  const orphanSuppliers = await prisma.supplier.findMany({
    where: { users: { every: { role: { not: 'SUPPLIER' } } } },
    include: { users: { select: { id: true, email: true, role: true } } },
  });
  console.log('Orphan suppliers:', orphanSuppliers.length);
  for (const s of orphanSuppliers) {
    for (const u of s.users) {
      console.log(' -', u.email, 'role:', u.role);
      await prisma.user.update({ where: { id: u.id }, data: { supplierId: null } });
    }
    await prisma.supplier.delete({ where: { id: s.id } });
    console.log('   -> cleaned up');
  }

  // Компании, у которых нет пользователя с ролью COMPANY
  const orphanCompanies = await prisma.company.findMany({
    where: { users: { every: { role: { not: 'COMPANY' } } } },
    include: { users: { select: { id: true, email: true, role: true } } },
  });
  console.log('Orphan companies:', orphanCompanies.length);
  for (const c of orphanCompanies) {
    for (const u of c.users) {
      console.log(' -', u.email, 'role:', u.role);
      await prisma.user.update({ where: { id: u.id }, data: { companyId: null } });
    }
    await prisma.company.delete({ where: { id: c.id } });
    console.log('   -> cleaned up');
  }

  // Производства, у которых нет пользователя с ролью MANUFACTURER
  const orphanManufacturers = await prisma.manufacturer.findMany({
    where: { users: { every: { role: { not: 'MANUFACTURER' } } } },
    include: { users: { select: { id: true, email: true, role: true } } },
  });
  console.log('Orphan manufacturers:', orphanManufacturers.length);
  for (const m of orphanManufacturers) {
    for (const u of m.users) {
      console.log(' -', u.email, 'role:', u.role);
      await prisma.user.update({ where: { id: u.id }, data: { manufacturerId: null } });
    }
    await prisma.manufacturer.delete({ where: { id: m.id } });
    console.log('   -> cleaned up');
  }

  console.log('Done!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
