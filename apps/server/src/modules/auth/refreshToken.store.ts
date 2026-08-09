import { createHash } from 'node:crypto';
import { redis } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { parseDurationToSeconds } from '../../utils/duration.js';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function refreshKey(userId: string, version: number): string {
  return `refresh:${userId}:${version}`;
}

// Storing one hash per (userId, version) — not per token — is what makes rotation
// work: issuing a new refresh token overwrites the old one's hash, so the old
// token silently stops matching even though it hasn't expired yet.
export async function storeRefreshToken(userId: string, version: number, token: string): Promise<void> {
  const ttlSeconds = parseDurationToSeconds(env.jwt.refreshExpiry);
  await redis.set(refreshKey(userId, version), hashToken(token), 'EX', ttlSeconds);
}

export async function isRefreshTokenValid(userId: string, version: number, token: string): Promise<boolean> {
  const stored = await redis.get(refreshKey(userId, version));
  return stored !== null && stored === hashToken(token);
}

export async function revokeRefreshToken(userId: string, version: number): Promise<void> {
  await redis.del(refreshKey(userId, version));
}
