import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
  name: z.string().min(1, 'Имя обязательно').max(100).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  inn: z.string().max(12).optional().nullable(),
  avatar: z.string().optional().nullable(),
  cover: z.string().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  website: z.string().max(200).optional().nullable(),
  socialLinks: z.string().optional().nullable(),
  profileBanners: z.string().optional().nullable(),
  profileTheme: z.string().optional().nullable(),
});

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessage = result.error.errors[0]?.message || 'Ошибка валидации';
  return { success: false, error: errorMessage };
}