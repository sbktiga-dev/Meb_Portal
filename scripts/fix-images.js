const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Удаляем старые 10 изображений и заменяем на новые с правильными URL
async function main() {
  // Удаляем наши 10 изображений (созданные нами)
  const titles = [
    'Кухня в стиле минимализм',
    'Гостиная с угловым диваном',
    'Спальня в нейтральных тонах',
    'Рабочая зона для дизайнера',
    'Кухонный остров с барной стойкой',
    'Прихожая с системой хранения',
    'Детская мебель — кровать-домик',
    'Гардеробная комната',
    'Столовая на 8 персон',
    'Ванная комната с мебелью',
  ];

  const deleted = await prisma.image.deleteMany({
    where: { title: { in: titles } },
  });
  console.log(`  🗑️  Удалено старых: ${deleted.count}`);

  // Новые изображения с проверенными URL
  const images = [
    {
      title: 'Кухня в стиле минимализм',
      description: 'Современная кухня с фасадами без ручек, матовым покрытием и встроенной техникой. Рабочая зона из искусственного камня, LED-подсветка. Стиль: скандинавский минимализм.',
      url: 'https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80',
      style: 'minimalism',
      category: 'kitchen',
      tags: JSON.stringify(['кухня', 'минимализм', 'белый', 'встроенная техника']),
    },
    {
      title: 'Гостиная с угловым диваном',
      description: 'Просторная гостиная с угловым диваном серого цвета, деревянным журнальным столиком и панорамными окнами. Интерьер в стиле contemporary с тёплыми акцентами.',
      url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
      style: 'contemporary',
      category: 'living',
      tags: JSON.stringify(['гостиная', 'диван', 'серый', 'дерево']),
    },
    {
      title: 'Спальня в нейтральных тонах',
      description: 'Уютная спальня с кроватью из натурального дерева, мягким изголовьем и постельным бельём льняных оттенков. Тумбы с минималистичным дизайном.',
      url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80',
      style: 'scandinavian',
      category: 'bedroom',
      tags: JSON.stringify(['спальня', 'дерево', 'нейтральные тона', 'уют']),
    },
    {
      title: 'Рабочая зона для дизайнера',
      description: 'Эргономичное рабочее место: стол из массива ореха, эргономичное кресло, система хранения для чертежей и образцов. Естественное освещение.',
      url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80',
      style: 'industrial',
      category: 'office',
      tags: JSON.stringify(['офис', 'рабочее место', 'эргономика', 'орех']),
    },
    {
      title: 'Кухонный остров с барной стойкой',
      description: 'Кухонный остров из тёмного камня с барной стойкой на 4 человека. Комбинированное освещение: подвесные лампы + LED под островом.',
      url: 'https://images.unsplash.com/photo-1556909211-36987daf7b4d?w=800&q=80',
      style: 'modern',
      category: 'kitchen',
      tags: JSON.stringify(['остров', 'барная стойка', 'камень', 'освещение']),
    },
    {
      title: 'Прихожая с системой хранения',
      description: 'Функциональная прихожая: встроенный шкаф от пола до потолка, обувная полка с подсветкой, зеркало в полный рост. Вместительность на семью из 4 человек.',
      url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
      style: 'modern',
      category: 'hallway',
      tags: JSON.stringify(['прихожая', 'шкаф', 'хранение', 'подсветка']),
    },
    {
      title: 'Детская мебель — кровать-домик',
      description: 'Детская кровать-домик из берёзы с защитными бортиками. Яркие акценты: подушка-подсолнух, плед мятного цвета. Безопасные краски на водной основе.',
      url: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&q=80',
      style: 'playful',
      category: 'kids',
      tags: JSON.stringify(['детская', 'кровать-домик', 'берёза', 'безопасность']),
    },
    {
      title: 'Гардеробная комната',
      description: 'Просторная гардеробная: открытые полки для одежды, выдвижные ящики с мягким закрытием, зона для обуви, зеркало с подсветкой. Организация пространства.',
      url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
      style: 'minimalism',
      category: 'wardrobe',
      tags: JSON.stringify(['гардеробная', 'организация', 'полки', 'ящики']),
    },
    {
      title: 'Столовая на 8 персон',
      description: 'Обеденный стол из массива дуба на 8 персон с основанием из чёрного металла. Стулья с тканевой обивкой. Винтажная люстра как акцент.',
      url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80',
      style: 'industrial',
      category: 'dining',
      tags: JSON.stringify(['столовая', 'стол', 'дуб', 'металл', 'винтаж']),
    },
    {
      title: 'Ванная комната с мебелью',
      description: 'Современная ванная: подвесная тумба с раковиной, зеркало с подсветкой, полки для косметики. Керамическая плитка large format, тёплые тона.',
      url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80',
      style: 'contemporary',
      category: 'bathroom',
      tags: JSON.stringify(['ванная', 'тумба', 'зеркало', 'плитка']),
    },
  ];

  let count = 0;
  for (const img of images) {
    try {
      await prisma.image.create({ data: img });
      count++;
      console.log('  ✅ ' + img.title);
    } catch (e) {
      console.log('  ❌ ' + img.title + ': ' + e.message);
    }
  }

  console.log('\n  Итого добавлено: ' + count + '/' + images.length);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
