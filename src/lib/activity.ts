import { prisma } from './prisma';

interface LogActivityOptions {
  action: string;
  userId?: string;
  details?: string;
  ip?: string;
}

export async function logActivity({ action, userId, details, ip }: LogActivityOptions) {
  try {
    await prisma.activityLog.create({
      data: { action, userId: userId || null, details: details || null, ip: ip || null },
    });
  } catch {
    // Fire and forget — don't break the main flow
  }
}
