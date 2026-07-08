import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function cleanup() {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  });
}

cleanup();
setInterval(cleanup, 60_000);

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export const RATE_LIMITS = {
  api: { windowMs: 60_000, maxRequests: 100 },
  auth: { windowMs: 60_000, maxRequests: 10 },
  upload: { windowMs: 60_000, maxRequests: 20 },
  search: { windowMs: 60_000, maxRequests: 30 },
  comment: { windowMs: 60_000, maxRequests: 10 },
  like: { windowMs: 60_000, maxRequests: 30 },
  follow: { windowMs: 60_000, maxRequests: 20 },
} as const;

// Квоты на пользователя (файлов всего)
export const USER_QUOTAS = {
  maxFilesPerUser: 200,        // Максимум файлов на аккаунт (изображения + документы)
  maxImagesPerUser: 150,       // Максимум изображений
  maxDocumentsPerUser: 50,     // Максимум документов
  maxPortfolioItems: 100,      // Максимум элементов портфолио
} as const;

export function getClientIp(req: NextRequest | Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, resetAt: entry.resetAt };
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function getRateLimitHeaders(result: { remaining: number; resetAt: number }) {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

export function checkDualRateLimit(
  ip: string,
  email: string | undefined,
  action: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; resetAt: number } {
  const ipKey = `${action}:ip:${ip}`;
  const ipResult = rateLimit(ipKey, maxRequests, windowMs);
  if (!ipResult.allowed) return ipResult;

  if (email) {
    const emailKey = `${action}:email:${email.toLowerCase().trim()}`;
    const emailResult = rateLimit(emailKey, maxRequests, windowMs);
    if (!emailResult.allowed) return emailResult;
  }

  return { allowed: true, resetAt: ipResult.resetAt };
}
