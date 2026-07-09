import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const client = new PrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = new Proxy<PrismaClient>({} as PrismaClient, {
  get(_, prop) {
    return (createClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
