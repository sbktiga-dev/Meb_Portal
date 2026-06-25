const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const testImages = [
  { title: 'Современный диван', style: 'Минимализм', category: 'Гостиная', tags: ['диван', 'минимализм', 'гостиная'] },
  { title: 'Кухонный гарнитур', style: 'Скандинавский', category: 'Кухня', tags: ['кухня', 'гарнитур', 'скандинавский'] },
  { title: 'Шкаф-купе', style: 'Современный', category: 'Спальня', tags: ['шкаф', 'спальня', 'современный'] },
  { title: 'Комод для спальни', style: 'Классика', category: 'Спальня', tags: ['комод', 'спальня', 'классика'] },
  { title: 'Обеденный стол', style: 'Лофт', category: 'Кухня', tags: ['стол', 'кухня', 'лофт'] },
  { title: 'Рабочий стол', style: 'Минимализм', category: 'Кабинет', tags: ['стол', 'кабинет', 'минимализм'] },
  { title: 'Журнальный столик', style: 'Современный', category: 'Гостиная', tags: ['столик', 'гостиная', 'современный'] },
];

const postTemplates = [
  {
    title: 'Новый проект: спальня в стиле минимализм',
    content: 'Завершили работу над проектом спальни. Использовали светлые тона, простые формы и натуральные материалы. Клиент доволен результатом!',
    category: 'project',
    tags: ['проект', 'спальня', 'минимализм', 'дизайн'],
  },
  {
    title: 'Тренды мебели 2026: что будет популярно',
    content: 'В этом году в тренде: округлые формы, натуральное дерево, зелёные акценты. Мебель становится мягче и уютнее. Делюсь своими наблюдениями.',
    category: 'article',
    tags: ['тренды', '2026', 'дизайн', 'мебель'],
  },
  {
    title: 'Поставщик фурнитуры Blum — обзор',
    content: 'Протестировали новую серию петель Blum. Качество отличное, установка простая. Рекомендую для кухонных проектов.',
    category: 'product',
    tags: ['blum', 'фурнитура', 'обзор', 'кухня'],
  },
  {
    title: 'Открытие нового цеха',
    content: 'Расширили производство! Новый цех позволяет увеличить.output в 3 раза. Установили новое ЧПУ-оборудование.',
    category: 'news',
    tags: ['производство', 'цех', 'оборудование'],
  },
  {
    title: 'Гардеробная комната — реализованный проект',
    content: 'Создали гардеробную для клиента. Система хранения от пола до потолка, встроенные ящики, выдвижные полки. Всё по индивидуальным размерам.',
    category: 'project',
    tags: ['гардеробная', 'проект', 'система хранения'],
  },
];

async function main() {
  console.log('Создаю тестовые изображения...');

  const createdImages = [];
  for (let i = 0; i < testImages.length; i++) {
    const img = testImages[i];
    const image = await prisma.image.create({
      data: {
        title: img.title,
        url: `/test-images/загруженное${i > 0 ? ' (' + i + ')' : ''}.jfif`,
        thumbnail: `/test-images/загруженное${i > 0 ? ' (' + i + ')' : ''}.jfif`,
        style: img.style,
        category: img.category,
        tags: JSON.stringify(img.tags),
        downloads: Math.floor(Math.random() * 50) + 5,
      },
    });
    createdImages.push(image);
    console.log(`  ✅ ${img.title}`);
  }

  console.log('\nСоздаю тестовые посты...');

  const users = await prisma.user.findMany({ take: 3 });
  if (users.length === 0) {
    console.log('❌ Нет пользователей в базе. Сначала зарегистрируйтесь.');
    return;
  }

  for (let i = 0; i < postTemplates.length; i++) {
    const tmpl = postTemplates[i];
    const user = users[i % users.length];
    const postImages = [];

    if (i < createdImages.length) postImages.push(createdImages[i].url);
    if (i + 1 < createdImages.length) postImages.push(createdImages[i + 1].url);

    const post = await prisma.post.create({
      data: {
        title: tmpl.title,
        content: tmpl.content,
        category: tmpl.category,
        images: JSON.stringify(postImages),
        tags: JSON.stringify(tmpl.tags),
        authorId: user.id,
        views: Math.floor(Math.random() * 200) + 10,
        likes: Math.floor(Math.random() * 30),
      },
    });
    console.log(`  ✅ ${tmpl.title} (автор: ${user.name || user.email})`);
  }

  console.log('\n✅ Готово! 7 изображений + 5 постов создано.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
