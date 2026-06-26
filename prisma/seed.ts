import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Очистка базы данных...');
  await prisma.download.deleteMany();
  await prisma.image.deleteMany();
  await prisma.document.deleteMany();
  await prisma.reference.deleteMany();
  await prisma.product.deleteMany();
  await prisma.specialist.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log('Создание пользователей...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  const userPassword = await bcrypt.hash('user123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@mebportal.ru',
      password: adminPassword,
      name: 'Администратор',
      role: 'ADMIN',
    },
  });

  const alexey = await prisma.user.create({
    data: {
      email: 'alexey@design.ru',
      password: userPassword,
      name: 'Алексей Петров',
      role: 'SPECIALIST',
    },
  });

  const maria = await prisma.user.create({
    data: {
      email: 'maria@tech.ru',
      password: userPassword,
      name: 'Мария Иванова',
      role: 'SPECIALIST',
    },
  });

  const dmitry = await prisma.user.create({
    data: {
      email: 'dmitry@install.ru',
      password: userPassword,
      name: 'Дмитрий Сидоров',
      role: 'SPECIALIST',
    },
  });

  const elena = await prisma.user.create({
    data: {
      email: 'elena@manager.ru',
      password: userPassword,
      name: 'Елена Козлова',
      role: 'SPECIALIST',
    },
  });

  console.log('Создание компаний...');
  const company1 = await prisma.company.create({
    data: {
      name: 'МебельМастер',
      description: 'Производство корпусной мебели на заказ. Более 15 лет на рынке. Собственное производство площадью 2000 м².',
      address: 'г. Москва, ул. Промышленная, 15',
      phone: '+7 (495) 123-45-67',
      email: 'info@mebelmaster.ru',
      website: 'https://mebelmaster.ru',
      isVerified: true,
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: 'КухниПрофи',
      description: 'Специализация — кухонные гарнитуры. Работаем с фасадами МДФ, массив, эмаль.',
      address: 'г. Санкт-Петербург, пр. Технический, 42',
      phone: '+7 (812) 987-65-43',
      email: 'info@kuhniprofi.ru',
      website: 'https://kuhniprofi.ru',
      isVerified: true,
    },
  });

  const company3 = await prisma.company.create({
    data: {
      name: 'СтолярнаяМастерская',
      description: 'Эксклюзивная мебель ручной работы из натурального дерева.',
      address: 'г. Казань, ул. Садовая, 8',
      phone: '+7 (843) 555-12-34',
      email: 'info@stolyarka.ru',
      isVerified: false,
    },
  });

  const company4 = await prisma.company.create({
    data: {
      name: 'ДизайнИнтерьеров',
      description: 'Полный цикл: дизайн-проект → производство → установка.',
      address: 'г. Новосибирск, ул. Интерьерная, 3',
      phone: '+7 (383) 222-88-99',
      email: 'info@designinterior.ru',
      website: 'https://designinterior.ru',
      isVerified: true,
    },
  });

  console.log('Создание поставщиков...');
  await prisma.supplier.create({
    data: {
      companyName: 'Blum Russia',
      description: 'Австрийская фурнитура для мебели. Направляющие, петли, подъёмники.',
      categories: JSON.stringify(['Фурнитура', 'Петли', 'Направляющие']),
      phone: '+7 (495) 111-22-33',
      email: 'sales@blum.ru',
      website: 'https://blum.com',
      isVerified: true,
    },
  });

  await prisma.supplier.create({
    data: {
      companyName: 'Egger ЛДСП',
      description: 'Ламинированные ДСП австрийского производства. Широкий выбор декоров.',
      categories: JSON.stringify(['ЛДСП', 'МДФ', 'Столешницы']),
      phone: '+7 (495) 444-55-66',
      email: 'order@egger.com',
      isVerified: true,
    },
  });

  await prisma.supplier.create({
    data: {
      companyName: 'Hettich',
      description: 'Немецкая фурнитура. Системы ящиков, петли, механизмы.',
      categories: JSON.stringify(['Фурнитура', 'Ящики', 'Петли']),
      phone: '+7 (495) 777-88-99',
      email: 'info@hettich.com',
      website: 'https://hettich.com',
      isVerified: true,
    },
  });

  await prisma.supplier.create({
    data: {
      companyName: 'Bosch Кухни',
      description: 'Встраиваемая техника для кухни. Духовые шкафы, варочные панели.',
      categories: JSON.stringify(['Техника', 'Посудомоечные', 'Вытяжки']),
      phone: '+7 (495) 222-33-44',
      email: 'info@bosch.ru',
      isVerified: false,
    },
  });

  await prisma.supplier.create({
    data: {
      companyName: 'Текс Краски',
      description: 'Краски и эмали для мебельного производства.',
      categories: JSON.stringify(['Краски', 'Эмали', 'Покрытия']),
      phone: '+7 (495) 555-66-77',
      email: 'sales@tex.ru',
      isVerified: false,
    },
  });

  console.log('Создание специалистов...');
  await prisma.specialist.create({
    data: {
      type: 'DESIGNER',
      description: 'Дизайнер интерьеров с опытом работы в мебельной отрасли. Специализация — кухни и гостиные.',
      experience: 8,
      rating: 4.8,
      portfolio: 'Выполнено более 200 проектов кухонь.',
      user: { connect: { id: alexey.id } },
    },
  });

  await prisma.specialist.create({
    data: {
      type: 'TECHNOLOGIST',
      description: 'Технолог мебельного производства. Составляю ТЗ, спецификации, технологические карты.',
      experience: 12,
      rating: 4.9,
      portfolio: 'Внедрила более 50 производственных линий.',
      user: { connect: { id: maria.id } },
    },
  });

  await prisma.specialist.create({
    data: {
      type: 'INSTALLER',
      description: 'Мастер по установке мебели. Установка кухонь, шкафов, встроенной мебели.',
      experience: 6,
      rating: 4.7,
      portfolio: 'Установлено более 500 кухонных гарнитуров.',
      user: { connect: { id: dmitry.id } },
    },
  });

  await prisma.specialist.create({
    data: {
      type: 'MANAGER',
      description: 'Менеджер по продажам мебели. Заключаю договоры, веду клиентов от замера до сдачи.',
      experience: 5,
      rating: 4.6,
      portfolio: 'Объём продаж — более 20 млн ₽ в год.',
      user: { connect: { id: elena.id } },
    },
  });

  console.log('Создание изображений...');
  const images = [
    { title: 'Кухня в стиле минимализм', description: 'Современная кухня с фасадами из МДФ, покрытыми эмалью. Белые фасады, столешница из искусственного камня.', url: '/uploads/1782336788220-0swu2q.jpg', style: 'Минимализм', category: 'Кухни', tags: JSON.stringify(['кухня', 'минимализм', 'белый']), downloads: 45 },
    { title: 'Гардеробная с островом', description: 'Просторная гардеробная с встроенной системой хранения и островом с ящиками.', url: '/uploads/1782336942856-7yo86i.jpg', style: 'Классика', category: 'Гардеробные', tags: JSON.stringify(['гардеробная', 'классика', 'остров']), downloads: 32 },
    { title: 'Шкаф-купе лофт', description: 'Встроенный шкаф-купе в стиле лофт с зеркальными раздвижными дверями.', url: '/uploads/1782337086104-uac5py.jpg', style: 'Лофт', category: 'Шкафы', tags: JSON.stringify(['шкаф', 'купе', 'лофт']), downloads: 28 },
    { title: 'Обеденный стол скандинавский', description: 'Стол из натурального дерева в скандинавском стиле. Чистые линии, тёплые тона.', url: '/uploads/1782337547578-3e4ga4.jpg', style: 'Скандинавия', category: 'Столы', tags: JSON.stringify(['стол', 'скандинавия', 'дерево']), downloads: 19 },
    { title: 'Кухонный гарнитур модерн', description: 'Кухня в стиле модерн с глянцевыми фасадами и встроенной техникой.', url: '/uploads/1782337627756-vzhet1.jpg', style: 'Модерн', category: 'Кухни', tags: JSON.stringify(['кухня', 'модерн', 'глянец']), downloads: 15 },
    { title: 'Стеллаж для книг кантри', description: 'Деревянный стеллаж в стиле кантри. Натуральное дерево, тёплые тона.', url: '/uploads/1782001538379-ffo84e.jfif', style: 'Кантри', category: 'Стеллажи', tags: JSON.stringify(['стеллаж', 'кантри', 'дерево']), downloads: 22 },
  ];

  for (const img of images) {
    await prisma.image.create({ data: img });
  }

  console.log('Создание документов...');
  const documents = [
    { title: 'Договор подряда на изготовление мебели', description: 'Стандартный договор подряда. Включает условия оплаты, сроки и гарантии.', fileUrl: '/uploads/docs/dogovor-podryad.docx', category: 'Договоры', fileType: 'docx', downloads: 120 },
    { title: 'Договор поставки мебельных изделий', description: 'Договор поставки между производителем и продавцом.', fileUrl: '/uploads/docs/dogovor-postavki.docx', category: 'Договоры', fileType: 'docx', downloads: 85 },
    { title: 'Акт выполненных работ', description: 'Шаблон акта для приёмки выполненных работ.', fileUrl: '/uploads/docs/akt-rabot.docx', category: 'Акты', fileType: 'docx', downloads: 95 },
    { title: 'Спецификация на кухонный гарнитур', description: 'Таблица спецификации с перечнем модулей и фурнитуры.', fileUrl: '/uploads/docs/specifikaciya.xlsx', category: 'Спецификации', fileType: 'xlsx', downloads: 110 },
    { title: 'Коммерческое предложение', description: 'Шаблон коммерческого предложения для клиента.', fileUrl: '/uploads/docs/kp.docx', category: 'Счета', fileType: 'docx', downloads: 75 },
    { title: 'Техническое задание на замер', description: 'Шаблон ТЗ для замерщика.', fileUrl: '/uploads/docs/tz-zamer.docx', category: 'ТЗ', fileType: 'docx', downloads: 60 },
    { title: 'Договор гарантийного обслуживания', description: 'Договор на гарантийное обслуживание мебели.', fileUrl: '/uploads/docs/dogovor-garantiya.docx', category: 'Договоры', fileType: 'docx', downloads: 55 },
    { title: 'Счёт-фактура', description: 'Шаблон счёта-фактуры.', fileUrl: '/uploads/docs/schet-faktura.xlsx', category: 'Счета', fileType: 'xlsx', downloads: 45 },
  ];

  for (const doc of documents) {
    await prisma.document.create({ data: doc });
  }

  console.log('Создание справочников...');
  const references = [
    {
      title: 'Стандартные размеры кухонной техники',
      description: 'Таблица размеров встраиваемой техники',
      category: 'Размеры',
      content: JSON.stringify({
        'Посудомоечная машина': ['600 мм × 550 мм × 820 мм'],
        'Духовой шкаф': ['600 мм × 550 мм × 600 мм'],
        'Варочная панель': ['600 мм × 520 мм × 40 мм'],
        'Вытяжка встраиваемая': ['600 мм × 280 мм × 400 мм'],
        'Холодильник встраиваемый': ['600 мм × 550 мм × 820 мм'],
      }),
    },
    {
      title: 'Таблица кромкования',
      description: 'Виды кромок и параметры применения',
      category: 'Размеры',
      content: JSON.stringify({
        'Кромка ПВХ 0.4мм': ['Прямая', 'Скрытые поверхности'],
        'Кромка ПВХ 0.8мм': ['Прямая', 'Стандартные детали'],
        'Кромка ПВХ 2.0мм': ['Скруглённая', 'Столешницы'],
        'Кромка ABS 2.0мм': ['Скруглённая', 'Мебель премиум'],
        'Кромка Алюминий': ['Декоративная', 'Декоративные элементы'],
      }),
    },
    {
      title: 'Паспорта фурнитуры Blum',
      description: 'Основные серии фурнитуры Blum',
      category: 'Фурнитура',
      content: JSON.stringify({
        'LEGRABOX': ['Направляющие', '30-65 кг'],
        'TANDEMBOX': ['Ящики', '30-65 кг'],
        'CLIP top': ['Петли', '110°/170°'],
        'AVENTOS': ['Подъёмники', 'HK/HS/HL'],
      }),
    },
    {
      title: 'Нормы расхода материалов',
      description: 'Таблица норм расхода на единицу мебели',
      category: 'Нормы',
      content: JSON.stringify({
        'ЛДСП 18мм': ['1.15 м²/м² готового изделия'],
        'Кромка ПВХ 2мм': ['4.2 м.п./м² готового изделия'],
        'Клей ПВА': ['0.15 кг/м² кромки'],
        'Шурупы 4×16': ['8 шт/соединение'],
      }),
    },
    {
      title: 'Сравнение материалов фасадов',
      description: 'Плюсы и минусы разных материалов',
      category: 'Материалы',
      content: JSON.stringify({
        'МДФ эмаль': ['Гладкая поверхность, любой цвет', 'Царапины, дорого'],
        'МДФ плёнка': ['Разнообразие фактур', 'Пузыри при нагреве'],
        'ЛДСП': ['Дёшево, стабильность', 'Скучный вид, видны кромки'],
        'Алюминий+стекло': ['Современный вид', 'Тяжёлое, дорогое'],
      }),
    },
  ];

  for (const ref of references) {
    await prisma.reference.create({ data: ref });
  }

  console.log('Создание продуктов...');
  const products = [
    { name: 'Петля Blum Clip Top 110°', description: 'Вкладная петля с мягким закрыванием', price: 350, category: 'Фурнитура', images: '[]' },
    { name: 'Направляющая Blum Tandembox', description: 'Выдвижной ящик полного выдвижения', price: 4200, category: 'Фурнитура', images: '[]' },
    { name: 'Подъемник Hettich Aventos HK', description: 'Для верхних шкафов с откидной дверцей', price: 8500, category: 'Фурнитура', images: '[]' },
    { name: 'ЛДСП 18 мм Sonoma', description: 'Популярный декор для корпусной мебели', price: 680, category: 'ЛДСП', images: '[]' },
    { name: 'МДФ 18 мм Белый', description: 'Для фасадов под окраску', price: 850, category: 'МДФ', images: '[]' },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }

  console.log('Создание производств...');
  const manufacturers = [
    { name: 'МебельФабрика+', description: 'Производство корпусной мебели. Кухни, гардеробные, шкафы. Площадь цеха 3000 м².', address: 'г. Москва, ул. Промышленная, 42', phone: '+7 (495) 100-20-30', email: 'info@mebelfabrika.ru', capabilities: JSON.stringify(['Кухни', 'Гардеробные', 'Шкафы', 'Корпусная мебель']), geometry: 'Москва и МО, доставка по России' },
    { name: 'Столярный Двор', description: 'Эксклюзивная мебель из массива дерева. Ручная работа, индивидуальные проекты.', address: 'г. Тверь, ул. Лесная, 15', phone: '+7 (482) 200-30-40', email: 'info@stolyarnyy.ru', capabilities: JSON.stringify(['Массив дерева', 'Резьба', 'Патинирование', 'Ручная работа']), geometry: 'Тверь, выезд по ЦФО' },
    { name: 'Фасад-Про', description: 'Производство фасадов МДФ и массив. Покрытие эмалью, плёнкой, постформинг.', address: 'г. Калуга, ул. Промышленная, 8', phone: '+7 (484) 300-40-50', email: 'info@fasad-pro.ru', capabilities: JSON.stringify(['МДФ эмаль', 'МДФ плёнка', 'Постформинг', 'Акрил']), geometry: 'Калуга, доставка по ЦФО' },
    { name: 'СтолешницыМастер', description: 'Изготовление столешниц: ламинированные, из искусственного камня, массив.', address: 'г. Владимир, ул. Промышленная, 22', phone: '+7 (492) 400-50-60', email: 'info@stoleshnitsy.ru', capabilities: JSON.stringify(['Ламинированные столешницы', 'Искусственный камень', 'Массив дуба']), geometry: 'Владимир, Иваново, доставка по ЦФО' },
  ];

  for (const mfg of manufacturers) {
    await prisma.manufacturer.create({ data: mfg });
  }

  console.log('Seed завершён!');
  console.log(`Создано: 5 пользователей, 4 компании, 5 поставщиков, 4 специалиста, 6 изображений, 8 документов, 5 справочников, 5 продуктов, 4 производства`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
