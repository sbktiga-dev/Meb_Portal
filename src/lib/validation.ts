export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function validatePostContent(content: string): { valid: boolean; error?: string } {
  if (content.length < 1) return { valid: false, error: 'Контент обязателен' };
  if (content.length > 10000) return { valid: false, error: 'Контент слишком длинный (макс. 10000 символов)' };
  return { valid: true };
}

export function validatePostTitle(title: string): { valid: boolean; error?: string } {
  if (title.length < 1) return { valid: false, error: 'Заголовок обязателен' };
  if (title.length > 200) return { valid: false, error: 'Заголовок слишком длинный (макс. 200 символов)' };
  return { valid: true };
}