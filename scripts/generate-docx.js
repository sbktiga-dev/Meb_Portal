const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, TabStopType, TabStopPosition, convertInchesToTwip } = require('docx');
const fs = require('fs');

function createDoc() {
  const doc = new Document({
    creator: "МебПортал",
    title: "Мебельный портал — Описание возможностей",
    description: "Полное описание функционала сервиса для мебельной отрасли",
    styles: {
      default: {
        heading1: {
          run: { size: 36, bold: true, color: "1a56db" },
          paragraph: { spacing: { before: 400, after: 200 } },
        },
        heading2: {
          run: { size: 28, bold: true, color: "1e40af" },
          paragraph: { spacing: { before: 300, after: 150 } },
        },
        heading3: {
          run: { size: 24, bold: true, color: "374151" },
          paragraph: { spacing: { before: 200, after: 100 } },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          // ===== ТИТУЛЬНАЯ СТРАНИЦА =====
          new Paragraph({ spacing: { before: 2000 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "МЕБЕЛЬНЫЙ ПОРТАЛ", bold: true, size: 56, color: "1a56db", font: "Calibri" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Библиотека мебельщика", size: 32, color: "6b7280", font: "Calibri", italics: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", color: "d1d5db", size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            children: [
              new TextRun({ text: "Полное описание возможностей и функций сервиса", size: 24, color: "4b5563" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Версия 2.0", size: 22, color: "6b7280" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "25 июня 2026 г.", size: 22, color: "6b7280" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Стек: Next.js 14 • React 18 • TypeScript • PostgreSQL • Tailwind CSS", size: 20, color: "9ca3af" }),
            ],
          }),

          // ===== СТРАНИЦА 2: О ПРОЕКТЕ =====
          new Paragraph({ pageBreakBefore: true }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "О ПРОЕКТЕ", bold: true })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Мебельный портал — первая российская платформа, объединяющая всю мебельную отрасль в одном месте.", size: 24, bold: true, color: "1e40af" }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Мы создали единое пространство, где поставщики, производители, дизайнеры и технологи могут находить друг друга, обмениваться опытом, размещать портфолио и находить нужные материалы — всё бесплатно и без регистрации.",
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: "Портал решает реальные проблемы мебельной отрасли: разрозненность информации, сложность поиска поставщиков, отсутствие единой базы справочников и технической документации.",
                size: 22,
              }),
            ],
          }),

          // Преимущества
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Наши преимущества" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ ", bold: true, color: "1a56db", size: 22 }),
              new TextRun({ text: "БЕСПЛАТНО", bold: true, size: 22 }),
              new TextRun({ text: " — полный доступ ко всем функциям без подписок и ограничений", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ ", bold: true, color: "1a56db", size: 22 }),
              new TextRun({ text: "БЕЗ АНАЛОГОВ", bold: true, size: 22 }),
              new TextRun({ text: " — единственная платформа такого типа в России", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ ", bold: true, color: "1a56db", size: 22 }),
              new TextRun({ text: "ДЛЯ ПРОФЕССИОНАЛОВ", bold: true, size: 22 }),
              new TextRun({ text: " — создано специалистами мебельной отрасли для специалистов", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ ", bold: true, color: "1a56db", size: 22 }),
              new TextRun({ text: "СОЦИАЛЬНАЯ СРЕДА", bold: true, size: 22 }),
              new TextRun({ text: " — лента, группы, сообщения, портфолио, подписки", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ ", bold: true, color: "1a56db", size: 22 }),
              new TextRun({ text: "ГОТОВ К РАБОТЕ", bold: true, size: 22 }),
              new TextRun({ text: " — 21 модель базы данных, 58 API-эндпоинтов, 25 UI-компонентов", size: 22 }),
            ],
          }),

          // ===== СТРАНИЦА 3: КАК ЭТО РАБОТАЕТ =====
          new Paragraph({ pageBreakBefore: true }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "КАК ЭТО РАБОТАЕТ", bold: true })],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({ text: "Портал объединяет все процессы мебельной отрасли в одной платформе:", size: 22 }),
            ],
          }),

          // Каталог изображений
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "📸 Каталог изображений" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Тысячи качественных фото мебели в разных стилях — минимализм, классика, лофт, скандинавия.", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Скачивайте бесплатно в высоком разрешении", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Используйте для презентаций клиентам", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Находите вдохновение по стилям и категориям", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "▸ Сохраняйте понравившиеся в избранное", size: 22 }),
            ],
          }),

          // Документы и справочники
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "📄 Документы и справочники" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Шаблоны договоров, спецификации, технические таблицы — всё что нужно для работы.", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Готовые шаблоны договоров подряда и поставки", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Таблицы размеров техники и фурнитуры", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Нормы расхода материалов", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "▸ Сравнение материалов фасадов", size: 22 }),
            ],
          }),

          // Каталог поставщиков
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "🏢 Каталог поставщиков и производств" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Поставщики фурнитуры, ЛДСП, техники с прямыми контактами и отзывами.", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Находите поставщиков по категориям и регионам", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Сравнивайте цены и условия", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Общайтесь напрямую через мессенджер", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "▸ Читайте отзывы других специалистов", size: 22 }),
            ],
          }),

          // Социальные функции
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "👥 Социальные функции" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Общайтесь с коллегами, делитесь опытом, создавайте сообщества.", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Лента новостей с постами от участников", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Подписывайтесь на интересных специалистов", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Создавайте группы по интересам", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Размещайте портфолио работ", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "▸ Общайтесь в личных сообщениях", size: 22 }),
            ],
          }),

          // ===== СТРАНИЦА 4: ФУНКЦИОНАЛ КАЖДОЙ СТРАНИЦЫ =====
          new Paragraph({ pageBreakBefore: true }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "ФУНКЦИОНАЛ СТРАНИЦ", bold: true })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "Подробное описание каждой кнопки и функции на страницах сервиса.", size: 22, color: "6b7280", italics: true }),
            ],
          }),

          // ГЛАВНАЯ СТРАНИЦА
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "🏠 Главная страница (/)" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Hero-секция:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ «Смотреть каталог» → переход в галерею изображений", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ «Зарегистрироваться бесплатно» → страница регистрации", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Статистика:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Анимированные счётчики: изображений, документов, компаний, специалистов, пользователей", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Популярные изображения:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Карточки с hover-эффектом → детальная страница изображения", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ «Смотреть все» → полная галерея", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Лента новостей:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Карточки постов с аватаром автора, тегами, лайками, комментариями", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Кнопка «Подписаться» на автора (FollowButton)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Клик по посту → детальная страница с лайтбоксом изображений", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Всё для мебельщика:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ «Библиотека изображений» → /gallery", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ «Документы и справочники» → /documents", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ «Каталог поставщиков» → /suppliers", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Популярные документы:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Карточки с иконками по типу файла (PDF, DOC, XLS)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Скачивание по клику", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Присоединяйтесь:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "▸ «Начать бесплатно» → /register", size: 22 }),
            ],
          }),

          // ШАПКА (HEADER)
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "📌 Шапка сайта (Header)" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Навигация (10 разделов):", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Лента → /feed — последние посты от участников", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Каталог → /gallery — галерея изображений мебели", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Товары → /products — каталог товаров с ценами", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Группы → /groups — сообщества по интересам", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ События → /events — мероприятия и вебинары", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Документы → /documents — шаблоны и справочники", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Справочники → /refs — технические таблицы", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Производства → /manufacturers — каталог производств", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Поставщики → /suppliers — каталог поставщиков", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Компании → /companies — каталог компаний", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Правая часть:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ 🔍 Поиск (Ctrl+K) — глобальный поиск по всем сущностям", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ 🔔 Уведомления — выпадающий список с непрочитанными", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ 📊 Дашборд — иконка сетки → /dashboard", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ 👤 Аватар — dropdown меню с профилем, настройками, выходом", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ ☰ Мобilenное меню — гамбургер для мобильных устройств", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ «Войти» / «Регистрация» — для неавторизованных пользователей", size: 22 }),
            ],
          }),

          // КАТАЛОГ ИЗОБРАЖЕНИЙ
          new Paragraph({ pageBreakBefore: true }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "📸 Каталог изображений (/gallery)" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Фильтры и сортировка:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Сортировка: по дате, по популярности (скачивания)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Фильтр по стилям: Минимализм, Классика, Лофт, Скандинавия и др.", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Фильтр по категориям: Кухни, Шкафы, Столы, Стеллажи и др.", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Карточка изображения:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Превью с hover-эффектом → детальная страница", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Название, стиль, категория", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Теги (badge-стиль)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Количество скачиваний", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ ⭐ Кнопка «Избранное» — добавление/удаление из избранного", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Детальная страница (/gallery/[id]):", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Полное изображение в высоком разрешении", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Описание, стиль, категория, теги", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ ⬇️ Кнопка «Скачать» — скачивание файла", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ ⭐ Кнопка «Избранное»", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "▸ Похожие изображения внизу страницы", size: 22 }),
            ],
          }),

          // ЛЕНТА НОВОСТЕЙ
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "📰 Лента новостей (/feed)" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Фильтры:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ По категории: Новости, Проекты, Статьи, Товары", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ По подпискам — только посты от подписанных пользователей", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Сортировка: новые, популярные, обсуждаемые", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Карточка поста:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Аватар автора с градиентом", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Имя автора и категория поста", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Заголовок и превью содержания", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Изображения поста (сетка 2x2)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Теги поста", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ ❤️ Лайк — toggle (нравится/не нравится)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ 💬 Комментарии — переход к списку комментариев", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ 👁 Просмотры — количество просмотров", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ ➕ «Подписаться» — подписка на автора", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Создание поста (/feed/new):", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Заголовок (обязательно, до 200 символов)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Содержание (обязательно, до 5000 символов)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Выбор категории (Новость/Проект/Статья/Товар)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ 📷 Загрузка изображений (до 10 штук)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Добавление тегов (до 10 тегов)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ «Опубликовать» / «Сохранить как черновик»", size: 22 }),
            ],
          }),

          // ДАШБОРД
          new Paragraph({ pageBreakBefore: true }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "📊 Личный кабинет (/dashboard)" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Главная страница дашборда:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Gradient hero-секция с именем и статистикой", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Счётчики: скачивания, посты, портфолио, подписчики, подписки", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ ➕ «Новый пост» → /feed/new", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ ➕ «Добавить портфолио» → /dashboard/portfolio/new", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Разделы дашборда:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ 👤 «Профиль» → /dashboard/profile — редактирование имени, телефона, ИНН, аватара", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ ⚙️ «Настройки» → /dashboard/settings — настройки уведомлений, удаление аккаунта", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ ⭐ «Избранное» → /dashboard/favorites — сохранённые изображения и документы", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ 🔖 «Закладки» → /dashboard/bookmarks — коллекции закладок", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ 💬 «Сообщения» → /dashboard/messages — личные диалоги", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ 🎨 «Портфолио» → /dashboard/portfolio — управление работами", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "▸ 📈 «Аналитика» → /dashboard/analytics — статистика активности", size: 22 }),
            ],
          }),

          // ПРОДУКТЫ
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "🛒 Каталог товаров (/products)" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Функции:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Карточки товаров с ценами и характеристиками", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Фильтрация по категориям: Фурнитура, ЛДСП, МДФ, Техника", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ «Сравнить» → /products/compare — таблица сравнения товаров", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Отзывы с рейтингом (1-5 звёзд)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "▸ Привязка к компании/поставщику", size: 22 }),
            ],
          }),

          // СПЕЦИАЛИСТЫ
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "👨‍💼 Специалисты (/specialists)" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Функции:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Карточки с рейтингом (звёзды), опытом, типом", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Типы: Дизайнер, Технолог, Монтажник, Менеджер", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ ⭐ Оценка специалиста (1-5 звёзд) с комментарием", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Портфолио работ специалиста", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "▸ Посты специалиста", size: 22 }),
            ],
          }),

          // ГРУППЫ
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "👥 Группы (/groups)" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Функции:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Создание групп (публичные/приватные)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ «Вступить» / «Покинуть» — управление участием", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Посты в группе (только для участников)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Список участников", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "▸ Обложка и описание группы", size: 22 }),
            ],
          }),

          // СООБЩЕНИЯ
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "💬 Сообщения (/dashboard/messages)" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Функции:", bold: true, size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Список бесед с превью последнего сообщения", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Чат с историей сообщений", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ «Написать сообщение» на профилях пользователей", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "▸ Статус прочтения (lastReadAt)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "▸ Rate limiting: 30 сообщений в минуту", size: 22 }),
            ],
          }),

          // ===== СТРАНИЦА: ТЕХНИЧЕСКИЕ ДАННЫЕ =====
          new Paragraph({ pageBreakBefore: true }),
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "ТЕХНИЧЕСКИЕ ДАННЫЕ", bold: true })],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Метрики проекта" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Страниц (frontend): 46", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ API-эндпоинтов: 58", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ UI-компонентов: 25", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Prisma-моделей: 21", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Стек: Next.js 14 + React 18 + TypeScript + PostgreSQL + Tailwind CSS", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Авторизация: JWT (7 дней) + bcrypt (12 раундов)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Rate Limiting: login 10/мин, register 5/мин, upload 20/мин, messages 30/мин", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Валидация: Zod schemas для всех форм", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Тесты: Jest (auth, validation, rate limiting)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Docker: Dockerfile + docker-compose.yml", size: 22 }),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Безопасность" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ JWT валидация в middleware (jose, Edge Runtime)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Проверка ролей для admin маршрутов", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Валидация magic bytes при загрузке файлов", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Блокировка опасных расширений (svg, php, exe)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Санитизация HTML input", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Credentials в .env (не отслеживается git)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Email верификация при регистрации (токен подтверждения)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Сброс пароля через email (токен с ограничением по времени)", size: 22 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "▸ Rate limiting: login 10/мин, register 5/мин, forgot-password 3/мин", size: 22 }),
            ],
          }),

          // ===== ПОДВАЛ =====
          new Paragraph({ pageBreakBefore: true }),
          new Paragraph({ spacing: { before: 4000 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", color: "d1d5db", size: 24 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "МебПортал — Библиотека мебельщика", bold: true, size: 28, color: "1a56db" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "Первая российская платформа для мебельной отрасли", size: 22, color: "6b7280" }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "25 июня 2026 г.", size: 20, color: "9ca3af" }),
            ],
          }),
        ],
      },
    ],
  });

  return doc;
}

async function main() {
  const doc = createDoc();
  const buffer = await Packer.toBuffer(doc);
  const outputPath = 'E:\\Код 2\\Мебельный_портал_описание_возможностей.docx';
  fs.writeFileSync(outputPath, buffer);
  console.log(`Документ сохранён: ${outputPath}`);
}

main().catch(console.error);
