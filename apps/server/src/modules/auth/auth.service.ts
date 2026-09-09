import type { Role } from '@forge-loom/shared-types';
import type { Role as PrismaRole, User } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import {
  storeRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
} from './refreshToken.store.js';
import { createProfileForRole } from './profileFactory.js';
import { resolveCollegeIdForRegistration } from './collegeProvisioning.js';
import { ApiError } from '../../utils/ApiError.js';
import type { RegisterInput, LoginInput, ChangePasswordInput } from './auth.validation.js';

interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

async function issueTokens(user: User): Promise<IssuedTokens> {
  const accessToken = signAccessToken({
    userId: user.id,
    role: user.role as unknown as Role,
    collegeId: user.collegeId ?? undefined,
  });

  const refreshToken = signRefreshToken({
    userId: user.id,
    version: user.refreshTokenVersion,
  });

  await storeRefreshToken(user.id, user.refreshTokenVersion, refreshToken);

  return { accessToken, refreshToken };
}

export async function registerUser(
  input: RegisterInput
): Promise<{ user: User; tokens: IssuedTokens }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const collegeId = await resolveCollegeIdForRegistration(
    input.role as Role,
    input.displayName,
    input.collegeId
  );

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: input.role as unknown as PrismaRole,
      collegeId,
    },
  });

  await createProfileForRole(input.role as Role, user.id, input.displayName, collegeId);

  const tokens = await issueTokens(user);
  return { user, tokens };
}

export async function loginUser(
  input: LoginInput
): Promise<{ user: User; tokens: IssuedTokens }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await comparePassword(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status === 'suspended') {
    throw new ApiError(403, 'This account has been suspended');
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await issueTokens(updated);
  return { user: updated, tokens };
}

export async function refreshSession(refreshToken: string): Promise<IssuedTokens> {
  const payload = verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.refreshTokenVersion !== payload.version) {
    throw new ApiError(401, 'Session has been invalidated, please log in again');
  }

  const valid = await isRefreshTokenValid(payload.userId, payload.version, refreshToken);
  if (!valid) {
    throw new ApiError(401, 'Refresh token has already been used or is invalid');
  }

  return issueTokens(user);
}

export async function logoutUser(userId: string, version: number): Promise<void> {
  await revokeRefreshToken(userId, version);
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput
): Promise<{ user: User; tokens: IssuedTokens }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const currentMatches = await comparePassword(input.currentPassword, user.passwordHash);
  if (!currentMatches) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  const passwordHash = await hashPassword(input.newPassword);
  // Bumping refreshTokenVersion invalidates every other session's refresh
  // token immediately (refreshSession rejects any token whose embedded
  // version no longer matches the DB) — the point of a password change.
  // That also orphans *this* request's own refresh token, so we reissue
  // fresh tokens below rather than leaving the caller logged out by the
  // very action they just took.
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      mustChangePassword: false,
      refreshTokenVersion: { increment: 1 },
    },
  });

  const tokens = await issueTokens(updated);
  return { user: updated, tokens };
}
