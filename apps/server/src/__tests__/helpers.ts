import type { Role as PrismaRole } from '@prisma/client';
import { createApp } from '../app.js';
import { connectDb, disconnectDb } from '../config/db.js';
import { prisma, connectPrisma, disconnectPrisma } from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';
import { toPrismaEnum } from '../utils/prismaEnum.js';
import { UserModel } from '../models/User.js';
import { Role } from '@forge-loom/shared-types';

export function buildApp() {
  return createApp();
}

export { connectDb, disconnectDb, connectPrisma, disconnectPrisma };

let counter = 0;
export function uniqueEmail(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@test.forgeloom.dev`;
}

export const TEST_PASSWORD = 'test-password-123';

// Mongo-backed — for test suites whose domain (Citadel, Score) is still
// entirely on Mongoose and never logs the user in over HTTP.
export async function createTestUser(role: Role, overrides: { email?: string } = {}) {
  const email = overrides.email ?? uniqueEmail(role);
  const passwordHash = await hashPassword(TEST_PASSWORD);
  const user = await UserModel.create({ email, passwordHash, role });
  return { user, email, password: TEST_PASSWORD };
}

// Postgres-backed — for test suites whose domain has moved to Prisma (Phase 2
// onward) and needs the created user to actually be able to log in via the
// real (now Postgres-backed) /api/auth/login endpoint.
export async function createTestUserPg(role: Role, overrides: { email?: string } = {}) {
  const email = overrides.email ?? uniqueEmail(role);
  const passwordHash = await hashPassword(TEST_PASSWORD);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: toPrismaEnum<PrismaRole>(role) },
  });
  return { user, email, password: TEST_PASSWORD };
}
