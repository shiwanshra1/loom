import type { Role } from './role.js';

export type UserStatus = 'active' | 'pending_verification' | 'suspended';

/** The safe, client-facing projection of a User document — never includes passwordHash. */
export interface PublicUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  collegeId?: string;
  // True for admin-provisioned accounts (single-create or CSV-bulk) that
  // haven't changed their system-generated temp password yet — the client
  // gates the entire app behind a forced password-change screen while true.
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthTokens {
  accessToken: string;
}
