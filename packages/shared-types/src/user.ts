import type { Role } from './role.js';

export type UserStatus = 'active' | 'pending_verification' | 'suspended';

/** The safe, client-facing projection of a User document — never includes passwordHash. */
export interface PublicUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  collegeId?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthTokens {
  accessToken: string;
}
