import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  name: z.string().min(1, 'Имя обязательно').max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

export const updateProfileSchema = z.object({
  name: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  inn: z.string().max(12).optional(),
  avatar: z.string().optional(),
  cover: z.string().optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().max(200).optional(),
  socialLinks: z.string().optional(),
});

export const createPostSchema = z.object({
  title: z.string().min(1, 'Заголовок обязателен').max(200),
  content: z.string().min(1, 'Содержание обязательно').max(5000),
  category: z.enum(['news', 'project', 'article', 'product']).default('news'),
  images: z.array(z.string()).max(10).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Комментарий обязателен').max(2000),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['public', 'private']).default('public'),
});

export const createEventSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  startDate: z.string().datetime().or(z.string().min(1)),
  endDate: z.string().datetime().optional(),
  type: z.enum(['offline', 'online', 'webinar']).default('offline'),
  maxParticipants: z.number().int().positive().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive().optional(),
  category: z.string().min(1, 'Категория обязательна'),
  brand: z.string().max(100).optional(),
  specs: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  images: z.array(z.string()).max(10).optional(),
});

export const createReviewSchema = z.object({
  score: z.number().int().min(1, 'Минимум 1').max(5, 'Максимум 5'),
  comment: z.string().max(2000).optional(),
});

export const createBookmarkSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(100),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(100),
});

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessage = result.error.errors[0]?.message || 'Ошибка валидации';
  return { success: false, error: errorMessage };
}
