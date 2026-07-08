import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { NextRequest } from 'next/server';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set');
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getUserFromToken(token: string) {
  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, inn: true, phone: true, avatar: true, interests: true, banned: true },
  });

  if (!user || user.banned) return null;

  return user;
}

export async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Не авторизован' as const, status: 401 as const };
  }
  const token = authHeader.split(' ')[1];
  const user = await getUserFromToken(token);
  if (!user) {
    return { user: null, error: 'Не авторизован' as const, status: 401 as const };
  }
  return { user, error: null, status: 200 as const };
}

export async function requireAdmin(request: NextRequest) {
  const result = await requireAuth(request);
  if (result.error) return result;
  if (result.user!.role !== 'ADMIN') {
    return { user: null, error: 'Доступ запрещён' as const, status: 403 as const };
  }
  return result;
}
