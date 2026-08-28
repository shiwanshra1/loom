import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';
import type { AuthenticatedUser } from '../middleware/authenticate.js';

interface RefreshTokenPayload {
  userId: string;
  version: number;
}

// @types/jsonwebtoken narrows `expiresIn` to a branded string type the `ms`
// package understands; our values come from plain env-var strings ("15m", "30d"),
// so the cast just tells TS to trust the runtime format instead of re-deriving it.
function asExpiresIn(value: string): SignOptions['expiresIn'] {
  return value as SignOptions['expiresIn'];
}

export function signAccessToken(user: AuthenticatedUser): string {
  return jwt.sign(user, env.jwt.accessSecret, { expiresIn: asExpiresIn(env.jwt.accessExpiry) });
}

export function verifyAccessToken(token: string): AuthenticatedUser {
  try {
    return jwt.verify(token, env.jwt.accessSecret) as AuthenticatedUser;
  } catch {
    throw new ApiError(401, 'Invalid or expired access token');
  }
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: asExpiresIn(env.jwt.refreshExpiry),
  });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, env.jwt.refreshSecret) as RefreshTokenPayload;
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
}
