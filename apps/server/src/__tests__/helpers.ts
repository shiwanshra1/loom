import { createApp } from '../app.js';
import { connectDb, disconnectDb } from '../config/db.js';
import { hashPassword } from '../utils/password.js';
import { UserModel } from '../models/User.js';
import { Role } from '@forge-loom/shared-types';

export function buildApp() {
  return createApp();
}

export { connectDb, disconnectDb };

let counter = 0;
export function uniqueEmail(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@test.forgeloom.dev`;
}

export const TEST_PASSWORD = 'test-password-123';

export async function createTestUser(role: Role, overrides: { email?: string } = {}) {
  const email = overrides.email ?? uniqueEmail(role);
  const passwordHash = await hashPassword(TEST_PASSWORD);
  const user = await UserModel.create({ email, passwordHash, role });
  return { user, email, password: TEST_PASSWORD };
}
