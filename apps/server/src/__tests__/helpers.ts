import type { Role as PrismaRole } from '@prisma/client';
import { Role } from '@forge-loom/shared-types';
import { createApp } from '../app.js';
import { prisma, connectPrisma, disconnectPrisma } from '../config/prisma.js';
import { hashPassword } from '../utils/password.js';
import { toPrismaEnum } from '../utils/prismaEnum.js';

export function buildApp() {
  return createApp();
}

// Every domain this suite covers (auth/courses/citadel/scoring/admin) moved
// off Mongo across Phases 1-6 — keeping the `connectDb`/`disconnectDb` names
// rather than renaming every test file to `connectPrisma` is deliberate,
// same public surface as before, different backing implementation, exactly
// like `config/prisma.ts` replaced `config/db.ts`'s role without every call
// site needing to know.
export const connectDb = connectPrisma;
export const disconnectDb = disconnectPrisma;

let counter = 0;
export function uniqueEmail(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@test.forgeloom.dev`;
}

export const TEST_PASSWORD = 'test-password-123';

export async function createTestUser(role: Role, overrides: { email?: string } = {}) {
  const email = overrides.email ?? uniqueEmail(role);
  const passwordHash = await hashPassword(TEST_PASSWORD);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: toPrismaEnum<PrismaRole>(role) },
  });
  return { user, email, password: TEST_PASSWORD };
}
