import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const URL_MAP: Record<string, string> = {
  '/uploads/kitchen-minimalism.jpg': '/uploads/1782336788220-0swu2q.jpg',
  '/uploads/wardrobe-island.jpg': '/uploads/1782336942856-7yo86i.jpg',
  '/uploads/wardrobe-loft.jpg': '/uploads/1782337086104-uac5py.jpg',
  '/uploads/table-scandinavian.jpg': '/uploads/1782337547578-3e4ga4.jpg',
  '/uploads/kitchen-modern.jpg': '/uploads/1782337627756-vzhet1.jpg',
  '/uploads/shelf-country.jpg': '/uploads/1782001538379-ffo84e.jfif',
};

async function main() {
  const images = await prisma.image.findMany();
  let updated = 0;

  for (const img of images) {
    const newUrl = URL_MAP[img.url];
    if (newUrl) {
      await prisma.image.update({
        where: { id: img.id },
        data: { url: newUrl, thumbnail: newUrl },
      });
      updated++;
    }
  }

  console.log(`Fixed ${updated} image URLs`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
