import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun } from 'docx';
import { writeFileSync } from 'fs';
import { readFileSync } from 'fs';
import { join } from 'path';

const PRIMARY_COLOR = 'F97316';
const GRAY = '666666';
const DARK = '1a1a1a';

function title(text: string) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, bold: true, size: 32, color: DARK })], spacing: { after: 200 } });
}

function subtitle(text: string) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, bold: true, size: 26, color: PRIMARY_COLOR })], spacing: { before: 300, after: 150 } });
}

function h3(text: string) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, bold: true, size: 22, color: DARK })], spacing: { before: 200, after: 100 } });
}

function para(text: string) {
  return new Paragraph({ children: [new TextRun({ text, size: 20, color: GRAY })], spacing: { after: 100 } });
}

function bold(text: string) {
  return new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: DARK })], spacing: { after: 100 } });
}

function bullet(text: string) {
  return new Paragraph({ children: [new TextRun({ text: `• ${text}`, size: 20, color: GRAY })], spacing: { after: 60 }, indent: { left: 400 } });
}

function screenshotPlaceholder(name: string) {
  return new Paragraph({
    children: [
      new TextRun({ text: `[Скриншот: ${name}]`, size: 18, color: '999999', italics: true }),
    ],
    spacing: { before: 100, after: 200 },
    alignment: AlignmentType.CENTER,
    border: { bottom: { style: BorderStyle.DASHED, size: 1, color: 'cccccc', space: 5 } },
  });
}

function divider() {
  return new Paragraph({ spacing: { before: 200, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'e0e0e0', space: 10 } } });
}

function featureRow(label: string, lite: string, pro: string, premium: string) {
  return new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18 })] })], width: { size: 40, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: lite, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: pro, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: premium, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
    ],
  });
}

async function generate() {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children: [
        // === Титульная страница ===
        new Paragraph({ spacing: { before: 3000 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'МЕБПОРТАЛ', bold: true, size: 56, color: PRIMARY_COLOR })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Библиотека мебельщика', size: 28, color: GRAY })], spacing: { after: 400 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'www.mebportal.online', size: 22, color: PRIMARY_COLOR })], spacing: { after: 200 } }),
        divider(),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Документация проекта', size: 24, color: GRAY })], spacing: { after: 100 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Июль 2026', size: 20, color: GRAY })] }),
        new Paragraph({ children: [new TextRun('')], pageBreakBefore: true }),

        // === Описание проекта ===
        title('Описание проекта'),
        para('МебПортал — современная онлайн-платформа для профессионалов мебельной индустрии. Объединяет поставщиков, производителей, дизайнеров, технологов и клиентов в едином информационном пространстве.'),
        h3('Целевая аудитория'),
        bullet('Дизайнеры — создание и демонстрация проектов'),
        bullet('Технологи — обмен опытом и документами'),
        bullet('Производства — поиск поставщиков и партнёров'),
        bullet('Поставщики — продвижение товаров и услуг'),
        bullet('Клиенты — поиск специалистов и заказ мебели'),
        h3('Стек технологий'),
        bullet('Next.js 14 (App Router) + TypeScript'),
        bullet('PostgreSQL (Neon) + Prisma ORM'),
        bullet('Tailwind CSS + React Hot Toast'),
        bullet('Vercel (хостинг) + Vercel Blob Storage'),
        divider(),

        // === Лента новостей ===
        title('1. Лента новостей'),
        para('Основной раздел для публикации контента. Пользователи делятся проектами, статьями, новостями и товарами.'),
        h3('Возможности'),
        bullet('Публикации с фото и видео (до 10 файлов)'),
        bullet('Лайки, комментарии, репосты'),
        bullet('Фильтрация по категориям (Новости, Проекты, Статьи, Товары)'),
        bullet('Поиск по заголовку, содержанию и тегам'),
        bullet('Сортировка: новые, популярные, обсуждаемые'),
        bullet('Продвинутые посты с меткой «Рекомендовано»'),
        h3('Преимущества'),
        para('Активное сообщество профессионалов, обмен опытом, продвижение контента через систему подписок.'),
        screenshotPlaceholder('Лента новостей — вид с фильтрами и постами'),
        divider(),

        // === Каталог изображений ===
        title('2. Каталог изображений'),
        para('Тысячи профессиональных фото мебели для вдохновения и презентаций.'),
        h3('Возможности'),
        bullet('Фильтрация по стилям и категориям'),
        bullet('Скачивание в высоком разрешении'),
        bullet('Баннеры рекомендованных поставщиков'),
        bullet('Lightbox для полноэкранного просмотра'),
        h3('Преимущества'),
        para('Визуальная библиотека для вдохновения и создания презентаций клиентам.'),
        screenshotPlaceholder('Каталог изображений — галерея с фильтрами'),
        divider(),

        // === Каталог поставщиков ===
        title('3. Каталог поставщиков'),
        para('Комплексный каталог поставщиков фурнитуры, материалов и комплектующих.'),
        h3('Возможности'),
        bullet('Фурнитура, материалы, комплектующие'),
        bullet('Верифицированные поставщики'),
        bullet('Контактная информация'),
        bullet('Категории товаров'),
        bullet('Приоритетная выдача для Pro/Premium'),
        h3('Преимущества'),
        para('Быстрый поиск надёжных поставщиков с проверенными аккаунтами.'),
        screenshotPlaceholder('Каталог поставщиков — карточки с логотипами и бейджами'),
        divider(),

        // === Каталог производств ===
        title('4. Каталог производств'),
        para('Каталог мебельных производств с описанием возможностей и портфолио.'),
        h3('Возможности'),
        bullet('Описание производственных мощностей'),
        bullet('Портфолио работ'),
        bullet('Географическое расположение'),
        bullet('Верификация и рейтинги'),
        bullet('Приоритет для Pro/Premium'),
        h3('Преимущества'),
        para('Найти проверенное производство для сотрудничества.'),
        screenshotPlaceholder('Каталог производств — карточки с информацией'),
        divider(),

        // === Каталог компаний ===
        title('5. Каталог компаний'),
        para('Каталог мебельных фирм и индивидуальных предпринимателей.'),
        h3('Возможности'),
        bullet('Описание деятельности компании'),
        bullet('Контакты и ссылки на сайты'),
        bullet('Верификация аккаунтов'),
        bullet('Приоритет для Pro/Premium'),
        h3('Преимущества'),
        para('Презентация компании потенциальным клиентам и партнёрам.'),
        screenshotPlaceholder('Каталог компаний — карточки с логотипами'),
        divider(),

        // === Специалисты ===
        title('6. Специалисты'),
        para('Каталог профессионалов: дизайнеров, технологов, установщиков, менеджеров.'),
        h3('Возможности'),
        bullet('Профили с портфолио работ'),
        bullet('Рейтинг и отзывы'),
        bullet('Опыт работы и специализация'),
        bullet('Подписка на специалистов'),
        h3('Преимущества'),
        para('Найти квалифицированного специалиста для проекта.'),
        screenshotPlaceholder('Каталог специалистов — карточки с рейтингами'),
        divider(),

        // === Группы ===
        title('7. Группы'),
        para('Тематические сообщества для общения и обмена опытом.'),
        bullet('Создание и вступление в группы'),
        bullet('Публикации и обсуждения внутри групп'),
        bullet('Управление участниками'),
        divider(),

        // === События ===
        title('8. События'),
        para('Календарь мероприятий: выставки, вебинары, встречи.'),
        bullet('Онлайн и офлайн формат'),
        bullet('Участие и регистрация'),
        bullet('Автоматическое удаление прошедших событий'),
        divider(),

        // === Документы и Справочники ===
        title('9. Документы и Справочники'),
        para('База технической документации и шаблонов.'),
        bullet('Шаблоны договоров и документов'),
        bullet('Техническая документация'),
        bullet('Справочники по размерам, нормам, материалам'),
        bullet('Скачивание файлов'),
        divider(),

        // === Товары ===
        title('10. Товары'),
        para('Каталог мебельных товаров с подробными характеристиками.'),
        bullet('Описание, характеристики, цены'),
        bullet('Отзывы и рейтинги'),
        bullet('Сравнение товаров'),
        bullet('Фотогалерея товаров'),
        divider(),

        // === Профиль ===
        title('11. Профиль пользователя'),
        para('VK-подобный формат профиля с полной информацией о пользователе.'),
        h3('Возможности'),
        bullet('Обложка и аватар с бейджем роли'),
        bullet('Био, локация, сайт, соцсети'),
        bullet('Статистика (посты, портфолио, подписчики)'),
        bullet('Вкладки: Публикации, Портфолио, Отзывы, О себе'),
        bullet('Контактная информация'),
        bullet('Рекламные посты (акции) для Premium'),
        bullet('Аналитика профиля для Premium'),
        h3('Преимущества'),
        para('Полная визитная карточка профессионала с возможностью продвижения.'),
        screenshotPlaceholder('Профиль пользователя — вид с вкладками и статистикой'),
        divider(),

        // === Подписки ===
        title('12. Подписки и тарифы'),
        para('Система подписок для продвижения контента и профиля.'),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Возможность', bold: true, size: 18 })] })], width: { size: 40, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Lite', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Pro', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Premium', bold: true, size: 18 })], alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
              ],
            }),
            featureRow('Цена/мес', '1 500 ₽', '4 000 ₽', '8 000 ₽'),
            featureRow('Цена/год', '15 000 ₽', '40 000 ₽', '80 000 ₽'),
            featureRow('Продвижение постов', '✅', '✅', '✅'),
            featureRow('Баннеры', '1 шт.', '2 шт./нед.', '4 шт./нед.'),
            featureRow('Приоритет в каталогах', '—', '✅', '✅ макс.'),
            featureRow('Значок', '—', 'PRO', 'PREMIUM'),
            featureRow('Рекламные посты', '—', '—', '✅'),
            featureRow('Аналитика профиля', '—', '—', '✅'),
          ],
        }),

        divider(),

        // === Админ-панель ===
        title('13. Админ-панель'),
        para('Полнофункциональная панель управления для администраторов.'),
        h3('Возможности'),
        bullet('Управление пользователями (просмотр, удаление)'),
        bullet('Управление подписками (активация, деактивация)'),
        bullet('Управление продвижением (посты и баннеры)'),
        bullet('Управление контентом (посты, изображения, документы)'),
        bullet('Статистика платформы'),
        bullet('CRUD для поставщиков, производств, компаний'),
        divider(),

        // === Технические особенности ===
        title('14. Технические особенности'),
        h3('Безопасность'),
        bullet('JWT-аутентификация через HTTP-only cookie'),
        bullet('Rate limiting (IP + email)'),
        bullet('Валидация email (российские домены)'),
        bullet('Обязательная верификация email'),
        bullet('Защита от XSS и SQL-инъекций'),
        h3('Производводительность'),
        bullet('Server-Side Rendering для SEO'),
        bullet('Cache-Control заголовки на API'),
        bullet('Lazy loading изображений'),
        bullet('Infinite Scroll для длинных списков'),
        bullet('Skeleton-загрузка для UX'),
        h3('Мобильная адаптация'),
        bullet('Адаптивный дизайн'),
        bullet('Нижняя панель навигации'),
        bullet('Touch-оптимизация'),
        bullet('Pinch-to-zoom для изображений'),
        divider(),

        // === Роуты ===
        title('15. Роуты приложения'),
        bullet('/ — Главная страница'),
        bullet('/feed — Лента новостей'),
        bullet('/gallery — Каталог изображений'),
        bullet('/products — Каталог товаров'),
        bullet('/suppliers — Каталог поставщиков'),
        bullet('/manufacturers — Каталог производств'),
        bullet('/companies — Каталог компаний'),
        bullet('/specialists — Каталог специалистов'),
        bullet('/groups — Группы'),
        bullet('/events — События'),
        bullet('/documents — Документы'),
        bullet('/refs — Справочники'),
        bullet('/profile/[id] — Профиль пользователя'),
        bullet('/dashboard — Личный кабинет'),
        bullet('/dashboard/tariffs — Тарифы подписок'),
        bullet('/dashboard/promotion — Продвижение'),
        bullet('/admin — Админ-панель'),
        bullet('/help — Помощь и инструкции'),
        bullet('/login — Вход'),
        bullet('/register — Регистрация'),
        divider(),

        // === Контакты ===
        title('Контакты'),
        bullet('Сайт: www.mebportal.online'),
        bullet('Email: info@mebportal.online'),
        bullet('Телефон: +7 (900) 123-45-67'),
        divider(),

        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ text: 'Документ подготовлен: июль 2026 | Версия 1.0', size: 18, color: GRAY, italics: true })] }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = join(process.cwd(), 'ДОКУМЕНТАЦИЯ_МЕБПОРТАЛ.docx');
  writeFileSync(outputPath, buffer);
  console.log(`✅ DOCX создан: ${outputPath}`);
}

generate().catch(console.error);
