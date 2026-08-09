import { Types } from 'mongoose';
import type { Role } from '@forge-loom/shared-types';
import { UserModel, type UserDocument } from '../../models/User.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { storeRefreshToken, isRefreshTokenValid, revokeRefreshToken } from './refreshToken.store.js';
import { createProfileForRole } from './profileFactory.js';
import { ApiError } from '../../utils/ApiError.js';
import type { RegisterInput, LoginInput } from './auth.validation.js';

interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

async function issueTokens(user: UserDocument): Promise<IssuedTokens> {
  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
    collegeId: user.collegeId?.toString(),
  });

  const refreshToken = signRefreshToken({
    userId: user._id.toString(),
    version: user.refreshTokenVersion,
  });

  await storeRefreshToken(user._id.toString(), user.refreshTokenVersion, refreshToken);

  return { accessToken, refreshToken };
}

export async function registerUser(
  input: RegisterInput
): Promise<{ user: UserDocument; tokens: IssuedTokens }> {
  const existing = await UserModel.findOne({ email: input.email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await UserModel.create({
    email: input.email,
    passwordHash,
    role: input.role,
    collegeId: input.collegeId ? new Types.ObjectId(input.collegeId) : undefined,
  });

  await createProfileForRole(input.role as Role, user._id, input.displayName);

  const tokens = await issueTokens(user);
  return { user, tokens };
}

export async function loginUser(input: LoginInput): Promise<{ user: UserDocument; tokens: IssuedTokens }> {
  const user = await UserModel.findOne({ email: input.email });
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

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueTokens(user);
  return { user, tokens };
}

export async function refreshSession(refreshToken: string): Promise<IssuedTokens> {
  const payload = verifyRefreshToken(refreshToken);

  const user = await UserModel.findById(payload.userId);
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
