import { PrismaClient } from '@prisma/client';
// Side-effect import: loads the right .env.* file before PrismaClient reads
// DATABASE_URL from process.env — same reason db.ts imports env.js.
import './env.js';

export const prisma = new PrismaClient();

export async function connectPrisma(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
