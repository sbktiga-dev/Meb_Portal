export interface EditorBlock {
  id: string;
  type: 'heading' | 'text' | 'image' | 'gallery' | 'quote' | 'divider' | 'button' | 'video';
  content: Record<string, any>;
  order: number;
  size?: 'full' | 'wide' | 'normal' | 'narrow';
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  gridSpan?: number;
  // Free positioning
  x?: number; // позиция X в пикселях
  y?: number; // позиция Y в пикселях
  w?: number; // ширина в пикселях (по умолчанию 100%)
  h?: number; // высота в пикселях (auto)
}

export interface PostTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'news' | 'project' | 'article' | 'product';
  roles: string[];
  blocks: Omit<EditorBlock, 'id' | 'order'>[];
}

export const BLOCK_TYPES = [
  { type: 'heading', label: 'Заголовок', icon: 'H' },
  { type: 'text', label: 'Текст', icon: 'T' },
  { type: 'image', label: 'Изображение', icon: '' },
  { type: 'video', label: 'Видео', icon: '▶' },
  { type: 'gallery', label: 'Галерея', icon: '' },
  { type: 'quote', label: 'Цитата', icon: '"' },
  { type: 'divider', label: 'Разделитель', icon: '—' },
  { type: 'button', label: 'Кнопка', icon: '' },
] as const;

export const POST_TEMPLATES: PostTemplate[] = [
  // Для мебельщиков
  {
    id: 'new-product',
    name: 'Новый товар',
    description: 'Представьте новый товар с фото и описанием',
    icon: '📦',
    category: 'product',
    roles: ['USER', 'COMPANY', 'MANUFACTURER'],
    blocks: [
      { type: 'heading', content: { text: 'Название товара', level: 2 } },
      { type: 'image', content: { url: '', caption: 'Фото товара' } },
      { type: 'text', content: { text: 'Описание товара: материалы, размеры, особенности' } },
      { type: 'text', content: { text: 'Цена: укажите цену или диапазон' } },
      { type: 'button', content: { text: 'Заказать', url: '' } },
    ],
  },
  {
    id: 'project',
    name: 'Проект / Референс',
    description: 'Покажите выполненный проект с фото',
    icon: '🏠',
    category: 'project',
    roles: ['USER', 'COMPANY', 'MANUFACTURER'],
    blocks: [
      { type: 'heading', content: { text: 'Название проекта', level: 2 } },
      { type: 'gallery', content: { images: ['', '', ''], columns: 2 } },
      { type: 'text', content: { text: 'Описание проекта: задача, решение, результат' } },
      { type: 'quote', content: { text: 'Отзыв клиента', author: 'Имя клиента' } },
    ],
  },
  {
    id: 'before-after',
    name: 'До / После',
    description: 'Сравните результат работ',
    icon: '🔄',
    category: 'project',
    roles: ['USER', 'COMPANY', 'MANUFACTURER'],
    blocks: [
      { type: 'heading', content: { text: 'До и после: название работ', level: 2 } },
      { type: 'gallery', content: { images: ['', ''], columns: 2 } },
      { type: 'text', content: { text: 'Описание работ: что было, что сделали, итог' } },
    ],
  },
  {
    id: 'production',
    name: 'Процесс производства',
    description: 'Покажите как создаётся мебель',
    icon: '⚙️',
    category: 'article',
    roles: ['USER', 'COMPANY', 'MANUFACTURER'],
    blocks: [
      { type: 'heading', content: { text: 'Процесс: название', level: 2 } },
      { type: 'text', content: { text: 'Этап 1: описание' } },
      { type: 'image', content: { url: '', caption: 'Фото этапа' } },
      { type: 'text', content: { text: 'Этап 2: описание' } },
      { type: 'image', content: { url: '', caption: 'Фото этапа' } },
    ],
  },
  // Для поставщиков
  {
    id: 'supplier-product',
    name: 'Товар у поставщика',
    description: 'Представьте товар с характеристиками',
    icon: '🏭',
    category: 'product',
    roles: ['SUPPLIER'],
    blocks: [
      { type: 'heading', content: { text: 'Название товара', level: 2 } },
      { type: 'image', content: { url: '', caption: 'Фото товара' } },
      { type: 'text', content: { text: 'Характеристики: размеры, вес, материал' } },
      { type: 'text', content: { text: 'Цена и условия поставки' } },
      { type: 'button', content: { text: 'Купить', url: '' } },
    ],
  },
  {
    id: 'discount',
    name: 'Акция / Скидка',
    description: 'Объявите акцию или скидку',
    icon: '🏷️',
    category: 'news',
    roles: ['SUPPLIER', 'COMPANY', 'MANUFACTURER'],
    blocks: [
      { type: 'heading', content: { text: 'Акция: название', level: 2 } },
      { type: 'image', content: { url: '', caption: 'Баннер акции' } },
      { type: 'text', content: { text: 'Условия акции' } },
      { type: 'text', content: { text: 'Сроки проведения' } },
      { type: 'button', content: { text: 'Подробнее', url: '' } },
    ],
  },
  {
    id: 'delivery',
    name: 'Условия доставки',
    description: 'Расскажите о доставке',
    icon: '🚚',
    category: 'news',
    roles: ['SUPPLIER'],
    blocks: [
      { type: 'heading', content: { text: 'Доставка: город/регион', level: 2 } },
      { type: 'text', content: { text: 'Условия доставки' } },
      { type: 'text', content: { text: 'Сроки и стоимость' } },
      { type: 'button', content: { text: 'Заказать доставку', url: '' } },
    ],
  },
  // Для специалистов
  {
    id: 'portfolio',
    name: 'Портфолио проекта',
    description: 'Покажите лучший проект',
    icon: '🖼️',
    category: 'project',
    roles: ['USER'],
    blocks: [
      { type: 'heading', content: { text: 'Название проекта', level: 2 } },
      { type: 'gallery', content: { images: ['', '', '', ''], columns: 2 } },
      { type: 'text', content: { text: 'Описание проекта' } },
      { type: 'quote', content: { text: 'Отзыв заказчика', author: 'Имя' } },
    ],
  },
  {
    id: 'review',
    name: 'Обзор материала',
    description: 'Поделитесь опытом с материалом',
    icon: '📋',
    category: 'article',
    roles: ['USER'],
    blocks: [
      { type: 'heading', content: { text: 'Обзор: название материала', level: 2 } },
      { type: 'image', content: { url: '', caption: 'Фото материала' } },
      { type: 'text', content: { text: 'Описание и впечатления' } },
      { type: 'text', content: { text: 'Плюсы и минусы' } },
      { type: 'heading', content: { text: 'Итог', level: 3 } },
      { type: 'text', content: { text: 'Общая оценка и рекомендация' } },
    ],
  },
  {
    id: 'tip',
    name: 'Совет / Лайфхак',
    description: 'Поделитесь полезным советом',
    icon: '💡',
    category: 'article',
    roles: ['USER', 'COMPANY', 'SUPPLIER', 'MANUFACTURER'],
    blocks: [
      { type: 'heading', content: { text: 'Совет: тема', level: 2 } },
      { type: 'text', content: { text: 'Текст совета' } },
      { type: 'image', content: { url: '', caption: 'Иллюстрация (необязательно)' } },
    ],
  },
  // Общие
  {
    id: 'news-empty',
    name: 'Новость',
    description: 'Свободный формат для новостей',
    icon: '📰',
    category: 'news',
    roles: ['USER', 'COMPANY', 'SUPPLIER', 'MANUFACTURER', 'ADMIN'],
    blocks: [
      { type: 'heading', content: { text: 'Заголовок новости', level: 2 } },
      { type: 'text', content: { text: 'Текст новости' } },
    ],
  },
  {
    id: 'blank',
    name: 'Пустой холст',
    description: 'Начните с нуля',
    icon: '✨',
    category: 'news',
    roles: ['USER', 'COMPANY', 'SUPPLIER', 'MANUFACTURER', 'ADMIN'],
    blocks: [],
  },
];

export function getTemplatesForRole(role: string): PostTemplate[] {
  return POST_TEMPLATES.filter(t => t.roles.includes(role));
}

export function createBlockFromType(type: EditorBlock['type']): EditorBlock {
  const defaults: Record<string, any> = {
    heading: { text: 'Заголовок', level: 2 },
    text: { text: 'Текст' },
    image: { url: '', caption: '' },
    video: { url: '' },
    gallery: { images: ['', ''], columns: 2 },
    quote: { text: 'Цитата', author: '' },
    divider: {},
    button: { text: 'Кнопка', url: '' },
  };
  return {
    id: Math.random().toString(36).slice(2, 10),
    type,
    content: defaults[type] || {},
    order: 0,
  };
}

// Video URL utilities
export function extractVideoEmbed(url: string): string | null {
  const trimmed = url.trim();
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(trimmed)) return trimmed;
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const rtMatch = trimmed.match(/rutube\.ru\/video\/([a-zA-Z0-9]+)\//);
  if (rtMatch) return `https://rutube.ru/embed/${rtMatch[1]}`;
  const vkMatch = trimmed.match(/vk\.com\/video(-?\d+_\d+)/);
  if (vkMatch) return `https://vk.com/video_ext.php?oid=${vkMatch[1].split('_')[0]}&id=${vkMatch[1].split('_')[1]}&hd=2`;
  return null;
}
