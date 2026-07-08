#!/usr/bin/env node

/**
 * Реалистичные тестовые пользователи для МебПортала
 *
 * Каждый бот — «личность» с интересами, привычками и уникальным поведением.
 * Регистрируется, просматривает ленту, комментирует, лайкает, подписывается,
 * создаёт посты, ищет контент, вступает в группы.
 *
 * Использование:
 *   node scripts/realistic-bots.js
 *
 * Конфигурация через переменные окружения:
 *   BASE_URL=http://localhost:3000 node scripts/realistic-bots.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PASSWORD = 'Test123456';

// ============================================
// ЛИЧНОСТИ БОТОВ
// ============================================

const PERSONAS = [
  {
    name: 'Алексей Волков',
    role: 'COMPANY',
    inn: generateINN(),
    specialty: 'Дизайн студия «Волков и Partners»',
    interests: ['дизайн', 'интерьер', 'проект'],
    postTemplates: [
      {
        title: 'Завершили проект: Квартира-студия 45 м² в ЖК «Панорама»',
        content: 'Наша студия завершила работу над проектом квартиры-студии. Задача клиента было создать пространство для молодой семьи с двумя детьми. Использовали мебель-трансформер, встроенные системы хранения. Кухня — фасады из МДФ с плёнкой ПВХ, столешница из искусственного камня. Все элементы спроектированы с учётом эргономики. Срок реализации — 6 недель. Бюджет — 480 000 ₽.',
        category: 'project',
        tags: ['проект', 'студия', 'интерьер', 'трансформер'],
      },
      {
        title: 'Тренды в дизайне кухонь 2026',
        content: 'Поделимся наблюдениями из нашей практики. В этом году заметен рост спроса на: кухни с островом (даже на 10 м²), комбинированные фасады (матовые + глянцевые), встроенную технику без ручек, LED-подсветку рабочей зоны. Клиенты всё чаще выбирают тёплые тона дерева в сочетании с белым. Предлагаем консультации по планировке — свяжитесь через личные сообщения.',
        category: 'article',
        tags: ['тренды', 'кухни', '2026', 'дизайн'],
      },
    ],
    commentStyle: 'professional', // экспертные комментарии
    activityLevel: 'medium',
  },
  {
    name: 'Мария Петрова',
    role: 'USER',
    specialistType: 'DESIGNER',
    specialty: 'Дизайнер интерьеров, 8 лет опыта',
    interests: ['фурнитура', 'материалы', 'цвет'],
    postTemplates: [
      {
        title: 'Сравнение фурнитуры Blum vs Hettich: что выбрать?',
        content: 'В своей практике работаю с обоими брендами. Blum — проверенный выбор, отличные направляющие и петли. Серия Metabox для ящиков — эталон. Hettich — более доступная альтернатива, при этом качество на высоком уровне. Лично я использую Blum для кухонь премиум-сегмента, Hettich — для стандартных проектов. Важно: экономия на фурнитуре = проблемы через 3-5 лет. Какой ваш опыт?',
        category: 'article',
        tags: ['фурнитура', 'blum', 'hettich', 'сравнение'],
      },
    ],
    commentStyle: 'detailed', // длинные содержательные комментарии
    activityLevel: 'high',
  },
  {
    name: 'Иван Кузнецов',
    role: 'MANUFACTURER',
    specialty: 'Мебельная фабрика «Кузнецов и Sons»',
    interests: ['производство', 'технологии', 'материалы'],
    postTemplates: [
      {
        title: 'Как мы производим корпусную мебель: от раскроя до сборки',
        content: 'Расскажем о нашем производстве. Фабрика работает с 2018 года. Мощность — до 200 единиц мебели в месяц. Используем: раскроечный станок Holz-Her, кромкооблицовочный станок Brandt, сверлильный станок Hettich. Сырьё — ЛДСП Egger, МДФ, натуральный шпон. Каждое изделие проходит 7 этапов контроля. Работаем по всей России. Срок изготовления — 14-21 рабочий день.',
        category: 'news',
        tags: ['производство', 'технология', 'фабрика'],
      },
    ],
    commentStyle: 'technical', // технические комментарии
    activityLevel: 'low',
  },
  {
    name: 'Елена Смирнова',
    role: 'SUPPLIER',
    specialty: 'Поставщик фурнитуры и комплектующих',
    interests: ['фурнитура', 'цены', 'поставки'],
    postTemplates: [
      {
        title: 'Обзор петель для кухонных фасадов: типы и выбор',
        content: 'Как поставщик фурнитуры расскажем о главных типах петель: 1) накладные (стандарт), 2) вкладные (для встроенного монтажа), 3) угловые (для карусельных шкафов), 4) с доводчиком (мягкое закрытие). При выборе учитывайте: угол открывания (95°, 110°, 165°), тип монтажной планки, грузоподъёмность. Работаем с физлицами и юрлицами. Доставка по Москве и МО — бесплатно. По России — от 3 дней.',
        category: 'article',
        tags: ['фурнитура', 'петли', 'обзор'],
      },
    ],
    commentStyle: 'sales', // с ноткой продаж
    activityLevel: 'medium',
  },
  {
    name: 'Дмитрий Орлов',
    role: 'USER',
    specialistType: 'INSTALLER',
    specialty: 'Монтажник мебели, 12 лет опыта',
    interests: ['монтаж', 'инструмент', 'советы'],
    postTemplates: [
      {
        title: 'Частые ошибки при установке кухонного гарнитура',
        content: 'За 12 лет работы видел многое. Топ-5 ошибок: 1) Неправильный замер — проверяйте 3 раза, 2) Игнорирование неровностей стены — используйте выравнивающие планки, 3) Экономия на крепеже — берите только оцинкованные саморезы, 4) Отсутствие зазора для вентиляции техники — минимум 5 см, 5) Нет доступа к коммуникациям после установки. Можем помочь с установкой — пишите в личку.',
        category: 'article',
        tags: ['монтаж', 'советы', 'кухня', 'ошибки'],
      },
    ],
    commentStyle: 'practical', // практические советы
    activityLevel: 'medium',
  },
  {
    name: 'Анна Лебедева',
    role: 'COMPANY',
    inn: generateINN(),
    specialty: 'Салон «Мебель-Хаус» — мебель для гостиной',
    interests: ['гостиная', 'диваны', 'столы'],
    postTemplates: [
      {
        title: 'Как выбрать диван для гостиной: гайд от салона',
        content: 'В нашем салоне представлено более 50 моделей диванов. Расскажем, на что обращать внимание: 1) Каркас — дерево или металл, 2) Наполнитель — пена, пружинный блок, или комбинация, 3) Обивка — ткань, экокожа, натуральная кожа, 4) Механизм — дельфин, еврокнижка, аккордеон. Для семьи с детьми рекомендуем ткань с тефлоновой пропиткой. Приходите в салон — поможем подобрать!',
        category: 'product',
        tags: ['диван', 'гостиная', 'выбор', 'советы'],
      },
    ],
    commentStyle: 'friendly', // дружелюбные
    activityLevel: 'high',
  },
  {
    name: 'Павел Морозов',
    role: 'USER',
    specialistType: 'TECHNOLOGIST',
    specialty: 'Технолог мебельного производства',
    interests: ['технологии', 'качество', 'стандарты'],
    postTemplates: [
      {
        title: 'Классы эмиссии ДСП: E1, E0, Super E — что скрывается за маркировкой',
        content: 'Тема актуальная, потому что很多 производители путают покупателей. Класс E1 — формальдегид до 0.124 мг/м³, допустимо для жилых помещений. Класс E0 — до 0.05 мг/м³, безопаснее. Super E / E0.5 — до 0.01 мг/м³, самое безопасное. На практике: для детской мебели — только E0/Super E, для кухонь — E1 допустимо, для офисной мебели — E1 стандарт. Важно: сертификат должен быть на каждую партию.',
        category: 'article',
        tags: ['ДСП', 'эмиссия', 'качество', 'стандарты'],
      },
    ],
    commentStyle: 'technical',
    activityLevel: 'low',
  },
  {
    name: 'Ольга Козлова',
    role: 'USER',
    specialistType: 'MANAGER',
    specialty: 'Руководитель отдела продаж «МебельГрупп»',
    interests: ['продажи', 'маркетинг', 'клиенты'],
    postTemplates: [
      {
        title: '5 приёмов увеличения среднего чека в мебельном бизнесе',
        content: 'Делюсь опытом из нашей компании. Мы увеличили средний чек на 35% за 6 месяцев: 1) Комплектные предложения — «кухня + столовая группа = скидка 10%», 2) Премиум-опции — предложите доводчики, LED-подсветку, 3) Допродажи — посуда, аксессуары, 4) Рассрочка — увеличивает конверсию на 20%, 5) VIP-обслуживание — персональный менеджер для чеков от 500 000 ₽. Какие приёмы используете вы?',
        category: 'article',
        tags: ['продажи', 'маркетинг', 'бизнес'],
      },
    ],
    commentStyle: 'business', // бизнес-комментарии
    activityLevel: 'high',
  },
];

// ============================================
// ТЕКСТЫ КОММЕНТАРИЕВ ПО СТИЛЮ
// ============================================

const COMMENT_STYLES = {
  professional: [
    'Отличный проект! Обратите внимание на сочетание текстур — это ключевой тренд этого года.',
    'Согласен с выбором материалов. В нашей практике МДФ с плёнкой ПВХ — оптимальное соотношение цена/качество.',
    'Интересное решение с планировкой. Мы обычно предлагаем类似ные варианты для студий.',
    'Хорошая работа! Важно учитывать освещение при проектировании мебели.',
    'Поддерживаю! Детали — вот что делает проект завершённым.',
    'Грамотный подход. Стоит добавить про вентиляцию — это часто забывают.',
  ],
  detailed: [
    'Интересное сравнение! Я добавлю: у Blum есть серия Tiomos для доводчиков — это лучший вариант на рынке. А Hettich хорош своими направляющими Sensys — очень тихий ход.',
    'Советую также обратить внимание на фурнитуру Grass — отличное качество для среднего ценового сегмента. У них хорошая линейка вертикальных подъёмников.',
    'У меня был опыт работы с китайской фурнитурой — через год всё начинает люфтить. Лучше сразу investing в проверенные бренды.',
    'Полезный обзор! Добавлю: при выборе петель важно учитывать тип крепления — screws или clip-on. Clip-on удобнее при сборке.',
    'А как вы относитесь к фурнитуре Ferrari? Видел их на выставке — выглядит достойно.',
  ],
  technical: [
    'На нашем производстве мы используем именно этот станок. Точность раскроя — до 0.1 мм.',
    'Хороший обзор! Стоит добавить про влажность материала — это критично для качества.',
    'Используем похожую технологию. Для ЛДСП рекомендуем кромку 0.4 мм — оптимально по цене.',
    'Правильно, контроль качества на каждом этапе — залог долговечности мебели.',
    'А какой клей используете для шпона? Мы перешли на PUR — дороже, но результат лучше.',
    'Согласен про раскроечный станок. Holz-Her — проверенная немецкая марка.',
  ],
  sales: [
    'Отличная статья! Кстати, у нас сейчас акция на петли Blum — скидка 15% при заказе от 100 шт.',
    'Мы поставляем такую фурнитуру. Если интересно — могу отправить прайс. Работаем без предоплаты для постоянных клиентов.',
    'Хороший обзор! Добавлю: у нас есть полный каталог с техническими характеристиками. Могу скинуть в личку.',
    'Для профессионалов — специальные условия. Напишите, обсудим сотрудничество.',
    'Цены от производителя — без наценки дистрибьютора. Доставка по всей России.',
  ],
  practical: [
    'Как монтажник скажу: самая частая проблема — неровные стены. Всегда берите строительный уровень!',
    'Отличные советы! Добавлю про шурупы — берите только оцинкованные, чёрные ржавеют.',
    'Советую всегда оставлять зазор 3 см от пола для вентиляции. Многие забывают.',
    'Проверено: при установке столешницы используйте силиконовый герметик — влага не попадёт.',
    'Правильно про замеры! Я всегда делаю тройной контроль: стена, проект, повторный замер.',
  ],
  friendly: [
    'Какая красивая мебель! Хочу к вам в салон заглянуть 😊',
    'Спасибо за подробный обзор! Очень помогло в выборе.',
    'Здорово! А у вас есть варианты для маленьких комнат?',
    'Интересно! А какая гарантия на диваны?',
    'Мы с мужем как раз ищем диван. Будем к вам!',
    'Красивые фото! А можно посмотреть больше моделей?',
  ],
  business: [
    'Хорошие данные! Мы у себя внедрили CRM и конверсия выросла на 15%.',
    'Согласен про рассрочку. Мы добавили оплату через Тинькофф Рассрочку — клиенты в восторге.',
    'Полезная информация! А как вы мотивируете менеджеров на допродажи?',
    'Ключевой момент — персонализация. Каждый клиент должен чувствовать себя особенным.',
    'Отличная стратегия! Мы пробовали программу лояльности — результат положительный.',
  ],
};

// ============================================
// ГЕНЕРАТОРЫ ДАННЫХ
// ============================================

function generateINN() {
  let inn = '77';
  for (let i = 0; i < 8; i++) inn += Math.floor(Math.random() * 10);
  return inn;
}

function generateEmail(name, index) {
  const translit = {
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    ' ': '',
  };

  let latin = '';
  for (const char of name.split(' ')[0]) {
    latin += translit[char] || char;
  }

  const domains = ['yandex.ru', 'mail.ru', 'bk.ru', 'gmail.com', 'rambler.ru'];
  const domain = domains[index % domains.length];
  return `${latin.toLowerCase()}${index}@${domain}`;
}

function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================
// API КЛИЕНТ
// ============================================

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = null;
    this.userId = null;
    this.userRole = null;
  }

  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, options);
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      return { ok: false, status: 0, data: { error: err.message } };
    }
  }

  // Auth
  async register(user) {
    const { ok, status, data } = await this.request('POST', '/api/auth/register', user);
    if (ok && data.token) {
      this.token = data.token;
      this.userId = data.user.id;
      this.userRole = data.user.role;
    }
    return { ok, status, data };
  }

  // Posts
  async createPost(post) {
    return this.request('POST', '/api/posts', post);
  }

  async getFeed(page = 1, limit = 10) {
    return this.request('GET', `/api/feed?page=${page}&limit=${limit}`);
  }

  async getPosts(page = 1, limit = 10, category = null) {
    const params = `page=${page}&limit=${limit}${category ? `&category=${category}` : ''}`;
    return this.request('GET', `/api/posts?${params}`);
  }

  // Comments
  async createComment(postId, content) {
    return this.request('POST', `/api/posts/${postId}/comments`, { content });
  }

  // Likes
  async likePost(postId) {
    return this.request('POST', `/api/posts/${postId}/like`);
  }

  // Follow
  async followUser(userId) {
    return this.request('POST', `/api/users/${userId}/follow`);
  }

  // Search
  async search(query) {
    return this.request('GET', `/api/search?q=${encodeURIComponent(query)}`);
  }

  // Groups
  async getGroups() {
    return this.request('GET', '/api/groups');
  }

  async createGroup(group) {
    return this.request('POST', '/api/groups', group);
  }

  async joinGroup(groupId) {
    return this.request('POST', `/api/groups/${groupId}/join`);
  }

  // Events
  async getEvents() {
    return this.request('GET', '/api/events');
  }

  async createEvent(event) {
    return this.request('POST', '/api/events', event);
  }

  async joinEvent(eventId) {
    return this.request('POST', `/api/events/${eventId}/join`);
  }

  // Catalogs
  async getCompanies() {
    return this.request('GET', '/api/companies');
  }

  async getSuppliers() {
    return this.request('GET', '/api/suppliers');
  }

  async getManufacturers() {
    return this.request('GET', '/api/manufacturers');
  }

  async getSpecialists() {
    return this.request('GET', '/api/specialists');
  }

  async getProducts() {
    return this.request('GET', '/api/products');
  }
}

// ============================================
// БОТ — ПОЛНОЦЕННЫЙ ПОЛЬЗОВАТЕЛЬ
// ============================================

class RealisticBot {
  constructor(persona, index) {
    this.persona = persona;
    this.index = index;
    this.email = generateEmail(persona.name, index);
    this.client = new ApiClient(BASE_URL);
    this.registered = false;
    this.stats = { posts: 0, comments: 0, likes: 0, follows: 0, searches: 0 };
    this.seenPostIds = new Set();
  }

  log(msg) {
    const prefix = `[${this.persona.name.split(' ')[0].padEnd(8)}]`;
    console.log(`  ${prefix} ${msg}`);
  }

  async delay(min = 300, max = 1500) {
    await randomDelay(min, max);
  }

  // --- Регистрация ---
  async register() {
    const user = {
      email: this.email,
      password: PASSWORD,
      name: this.persona.name,
      role: this.persona.role,
      specialistType: this.persona.specialistType,
      inn: this.persona.inn,
    };

    const { ok, data } = await this.client.register(user);
    if (ok) {
      this.registered = true;
      this.log(`Зарегистрирован (${this.persona.specialty})`);
    } else {
      this.log(`Ошибка регистрации: ${data.error}`);
    }
    return ok;
  }

  // --- Просмотр ленты ---
  async browseFeed() {
    this.log('Просматриваю ленту...');
    const { ok, data } = await this.client.getFeed(1, 20);
    if (!ok || !data.posts) return [];

    const posts = data.posts;
    this.log(`  Нашёл ${posts.length} постов`);

    // Симулируем阅读 постов (отмечаем как просмотренные)
    for (const post of posts.slice(0, 5 + Math.floor(Math.random() * 10))) {
      this.seenPostIds.add(post.id);
      await this.delay(100, 400); // читаем пост
    }

    return posts;
  }

  // --- Лайки ---
  async likePosts(posts, count = null) {
    if (!posts.length) return;

    const likeCount = count || (1 + Math.floor(Math.random() * 4));
    const postsToLike = shuffle(posts.filter((p) => p.author?.id !== this.client.userId)).slice(0, likeCount);

    if (postsToLike.length === 0) return;
    this.log(`Ставлю лайк ${postsToLike.length} постам...`);

    for (const post of postsToLike) {
      const { ok } = await this.client.likePost(post.id);
      if (ok) {
        this.stats.likes++;
        this.log(`  ❤️  "${post.title?.substring(0, 30)}..."`);
      }
      await this.delay(200, 600);
    }
  }

  // --- Комментарии ---
  async commentOnPosts(posts, count = null) {
    if (!posts.length) return;

    const commentCount = count || (1 + Math.floor(Math.random() * 3));
    const postsToComment = shuffle(posts.filter((p) => p.author?.id !== this.client.userId)).slice(0, commentCount);

    if (postsToComment.length === 0) return;
    this.log(`Пишу ${postsToComment.length} комментариев...`);

    const style = COMMENT_STYLES[this.persona.commentStyle] || COMMENT_STYLES.friendly;

    for (const post of postsToComment) {
      const content = randomItem(style);
      const { ok } = await this.client.createComment(post.id, content);
      if (ok) {
        this.stats.comments++;
        this.log(`  💬 → "${post.title?.substring(0, 25)}..."`);
      }
      await this.delay(500, 1500);
    }
  }

  // --- Подписки ---
  async followUsers(posts, count = null) {
    if (!posts.length) return;

    const followCount = count || (1 + Math.floor(Math.random() * 3));
    const authors = [...new Set(posts.map((p) => p.author?.id).filter(Boolean))];
    const usersToFollow = shuffle(authors.filter((id) => id !== this.client.userId)).slice(0, followCount);

    if (usersToFollow.length === 0) return;
    this.log(`Подписываюсь на ${usersToFollow.length} пользователей...`);

    for (const userId of usersToFollow) {
      const { ok } = await this.client.followUser(userId);
      if (ok) {
        this.stats.follows++;
        this.log(`  👤 Подписка`);
      }
      await this.delay(300, 800);
    }
  }

  // --- Создание постов ---
  async createPosts(count = null) {
    const postCount = count || (this.persona.activityLevel === 'high' ? 2 : 1);
    this.log(`Создаю ${postCount} постов...`);

    for (let i = 0; i < postCount; i++) {
      const template = this.persona.postTemplates[i % this.persona.postTemplates.length];

      const post = {
        title: template.title,
        content: template.content,
        category: template.category,
        tags: template.tags,
        images: [],
      };

      const { ok, data } = await this.client.createPost(post);
      if (ok) {
        this.stats.posts++;
        this.log(`  📄 "${template.title.substring(0, 40)}..."`);
      } else {
        this.log(`  ❌ Ошибка: ${data.error}`);
      }
      await this.delay(800, 2000);
    }
  }

  // --- Поиск ---
  async searchContent() {
    const queries = ['кухня', 'фурнитура', 'дизайн', 'материалы', 'диван', 'шкаф'];
    const query = randomItem(queries);

    this.log(`Ищу: "${query}"`);
    const { ok, data } = await this.client.search(query);

    if (ok && data.results) {
      const total = (data.results.posts?.length || 0) +
                    (data.results.images?.length || 0) +
                    (data.results.users?.length || 0);
      this.log(`  Найдено: ${total} результатов`);
      this.stats.searches++;
    }

    await this.delay(300, 600);
  }

  // --- Просмотр каталогов ---
  async browseCatalogs() {
    this.log('Просматриваю каталоги...');

    // Просматриваем разные каталоги
    const actions = [
      () => this.client.getCompanies(),
      () => this.client.getSuppliers(),
      () => this.client.getSpecialists(),
      () => this.client.getProducts(),
    ];

    const action = randomItem(actions);
    const { ok, data } = await action();

    if (ok) {
      const count = data.companies?.length || data.suppliers?.length ||
                    data.specialists?.length || data.products?.length || 0;
      this.log(`  Найдено ${count} записей`);
    }

    await this.delay(400, 800);
  }

  // --- Вступление в группы ---
  async joinGroups() {
    const { ok, data } = await this.client.getGroups();
    if (!ok || !data.groups?.length) return;

    const group = randomItem(data.groups);
    this.log(`Вступаю в группу: "${group.name}"`);

    const { ok: joinOk } = await this.client.joinGroup(group.id);
    if (joinOk) {
      this.log(`  ✅ Вступил в группу`);
    }

    await this.delay(300, 600);
  }

  // --- Создание группы ---
  async createGroup() {
    if (this.persona.activityLevel !== 'high') return;

    const groupNames = {
      'Дизайн студия «Волков и Partners»': 'Дизайн-проекты и советы',
      'Дизайнер интерьеров': 'Портфолио дизайнеров',
      'Мебельная фабрика': 'Обсуждение технологий производства',
      'Поставщик фурнитуры': 'Каталог и цены',
      'Монтажник мебели': 'Советы по установке',
      'Салон «Мебель-Хаус»': 'Новинки салона',
      'Технолог мебели': 'Технические обсуждения',
      'Отдел продаж': 'Маркетинг и продажи',
    };

    const name = groupNames[this.persona.specialty] || `${this.persona.specialty} — сообщество`;

    this.log(`Создаю группу: "${name}"`);
    const { ok } = await this.client.createGroup({
      name,
      description: `Группа для профессионалов: ${this.persona.specialty}`,
      type: 'public',
    });

    if (ok) {
      this.log(`  ✅ Группа создана`);
    }

    await this.delay(300, 600);
  }

  // --- Создание мероприятия ---
  async createEvent() {
    if (this.persona.activityLevel !== 'high') return;

    const now = new Date();
    const startDate = new Date(now.getTime() + (3 + Math.floor(Math.random() * 7)) * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

    const event = {
      title: `Вебинар: ${randomItem(['Тренды мебели', 'Новые технологии', 'Маркетинг в мебельном бизнесе', 'Выбор материалов'])}`,
      description: 'Онлайн-вебинар для профессионалов мебельной индустрии. Регистрация бесплатная.',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      type: 'webinar',
      location: 'Zoom',
    };

    this.log(`Создаю мероприятие: "${event.title}"`);
    const { ok } = await this.client.createEvent(event);

    if (ok) {
      this.log(`  ✅ Мероприятие создано`);
    }

    await this.delay(300, 600);
  }

  // --- Полный цикл активности ---
  async runSession(allPosts = []) {
    if (!this.registered) return;

    this.log(`\n--- Сессия активности ---`);

    // 1. Просматриваем ленту
    const posts = await this.browseFeed();
    const feedPosts = posts.length > 0 ? posts : allPosts;

    await this.delay(500, 1000);

    // 2. Ставим лайки
    await this.likePosts(feedPosts);

    await this.delay(300, 700);

    // 3. Подписываемся на авторов
    await this.followUsers(feedPosts);

    await this.delay(400, 900);

    // 4. Комментируем
    await this.commentOnPosts(feedPosts);

    await this.delay(500, 1000);

    // 5. Ищем контент
    await this.searchContent();

    await this.delay(300, 600);

    // 6. Просматриваем каталоги
    await this.browseCatalogs();

    await this.delay(400, 800);

    // 7. Вступаем в группы
    await this.joinGroups();

    this.log(`  Статистика: ${this.stats.posts} постов, ${this.stats.comments} комментариев, ${this.stats.likes} лайков, ${this.stats.follows} подписок`);
  }
}

// ============================================
// ГЛАВНЫЙ ПРОЦЕСС
// ============================================

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('  РЕАЛИСТИЧНЫЕ ТЕСТОВЫЕ ПОЛЬЗОВАТЕЛИ — МЕБПОРТАЛ');
  console.log('═'.repeat(60));
  console.log(`\n  Сервер: ${BASE_URL}`);
  console.log(`  Пользователей: ${PERSONAS.length}`);
  console.log('');

  // Проверка сервера
  console.log('🔌 Проверка сервера...');
  try {
    const res = await fetch(`${BASE_URL}/api/posts?limit=1`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    console.log('  ✅ Сервер доступен\n');
  } catch (err) {
    console.log(`  ❌ Сервер недоступен: ${err.message}`);
    console.log('  Запустите: npm run dev\n');
    process.exit(1);
  }

  // Фаза 1: Регистрация
  console.log('─'.repeat(60));
  console.log('  ФАЗА 1: Регистрация');
  console.log('─'.repeat(60));

  const bots = [];
  for (let i = 0; i < PERSONAS.length; i++) {
    const bot = new RealisticBot(PERSONAS[i], i);
    const ok = await bot.register();
    if (ok) bots.push(bot);
    await randomDelay(800, 2000);
  }

  console.log(`\n  ✅ Зарегистрировано: ${bots.length}/${PERSONAS.length}\n`);

  if (bots.length === 0) {
    console.log('  ❌ Ни один бот не зарегистрирован. Выход.\n');
    process.exit(1);
  }

  // Фаза 2: Создание контента (высокоактивные пользователи)
  console.log('─'.repeat(60));
  console.log('  ФАЗА 2: Создание контента');
  console.log('─'.repeat(60));

  for (const bot of bots) {
    if (bot.persona.activityLevel === 'high') {
      await bot.createPosts(2);
    } else if (bot.persona.activityLevel === 'medium') {
      await bot.createPosts(1);
    }
    await randomDelay(1000, 2500);
  }

  // Фаза 3: Создание групп и мероприятий
  console.log('\n' + '─'.repeat(60));
  console.log('  ФАЗА 3: Группы и мероприятия');
  console.log('─'.repeat(60));

  for (const bot of bots) {
    await bot.createGroup();
    await bot.createEvent();
    await randomDelay(500, 1200);
  }

  // Фаза 4: Социальная активность (все пользователи)
  console.log('\n' + '─'.repeat(60));
  console.log('  ФАЗА 4: Активность');
  console.log('─'.repeat(60));

  // Сначала собираем все посты
  const { ok, data } = await bots[0].client.getFeed(1, 50);
  const allPosts = ok ? data.posts : [];

  for (const bot of bots) {
    await bot.runSession(allPosts);
    await randomDelay(1500, 3500);
  }

  // Итоги
  console.log('\n' + '═'.repeat(60));
  console.log('  ИТОГИ');
  console.log('═'.repeat(60));

  let totalPosts = 0, totalComments = 0, totalLikes = 0, totalFollows = 0;

  console.log('\n  Пользователи:');
  for (const bot of bots) {
    const p = bot.persona;
    console.log(`    ${bot.registered ? '✅' : '❌'} ${p.name.padEnd(20)} | ${p.role.padEnd(12)} | ${p.specialty}`);
    totalPosts += bot.stats.posts;
    totalComments += bot.stats.comments;
    totalLikes += bot.stats.likes;
    totalFollows += bot.stats.follows;
  }

  console.log(`\n  Всего создано:`);
  console.log(`    📄 Постов:       ${totalPosts}`);
  console.log(`    💬 Комментариев: ${totalComments}`);
  console.log(`    ❤️  Лайков:       ${totalLikes}`);
  console.log(`    👤 Подписок:     ${totalFollows}`);

  console.log(`\n  Аккаунты для входа (пароль: ${PASSWORD}):`);
  for (const bot of bots) {
    if (bot.registered) {
      console.log(`    ${bot.email}`);
    }
  }

  console.log('\n  ✅ Готово! Проверьте ленту на сервере.\n');
}

main().catch(console.error);
