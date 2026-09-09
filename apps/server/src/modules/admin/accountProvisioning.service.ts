import { Role } from '@forge-loom/shared-types';
import type { Role as PrismaRole, User } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword } from '../../utils/password.js';
import { generateTempPassword } from '../../utils/generatePassword.js';
import { toPrismaEnum } from '../../utils/prismaEnum.js';
import { createProfileForRole } from '../auth/profileFactory.js';
import { enqueueWelcomeEmail } from '../../jobs/welcomeEmailQueue.js';

export interface CreateAdminManagedAccountInput {
  role: Role;
  email: string;
  displayName: string;
  collegeId?: string;
}

export interface CreateAdminManagedAccountResult {
  user: User;
  tempPassword: string;
}

/**
 * Single funnel for every admin-driven account creation — Forge Admin peers
 * (Phase 4) today, and college-admin-created students/mentors/trainers
 * (Phase 6+) later. Generates + hashes an 8-digit temp password, creates the
 * User with mustChangePassword: true, delegates to the existing
 * createProfileForRole for the role-specific profile row, and enqueues the
 * welcome email — never sends it synchronously and never logs the plaintext
 * password.
 */
export async function createAdminManagedAccount(
  input: CreateAdminManagedAccountInput
): Promise<CreateAdminManagedAccountResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: toPrismaEnum<PrismaRole>(input.role),
      collegeId: input.collegeId,
      mustChangePassword: true,
    },
  });

  await createProfileForRole(input.role, user.id, input.displayName, input.collegeId);

  await enqueueWelcomeEmail({
    userId: user.id,
    email: user.email,
    displayName: input.displayName,
    tempPassword,
  });

  return { user, tempPassword };
}
