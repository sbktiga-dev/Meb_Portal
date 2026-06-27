const ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

export function sanitizeHtml(input: string): string {
  return input.replace(/[&<>"'/]/g, (char) => ENTITY_MAP[char] || char);
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) return { valid: false, error: 'Пароль должен быть не менее 6 символов' };
  if (password.length > 128) return { valid: false, error: 'Пароль слишком длинный' };
  return { valid: true };
}

export function validateName(name: string): { valid: boolean; error?: string } {
  if (name.length < 1) return { valid: false, error: 'Имя обязательно' };
  if (name.length > 100) return { valid: false, error: 'Имя слишком длинное' };
  return { valid: true };
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

export function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,30}$/.test(id);
}
