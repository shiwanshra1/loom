import type { PublicUser, Role, UserStatus } from '@forge-loom/shared-types';
import type { User } from '@prisma/client';

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    // Prisma generates its own `Role`/`UserStatus` enums from schema.prisma —
    // same string values as shared-types', but TS treats distinct string
    // enums as nominally incompatible even with identical members, hence
    // the casts.
    role: user.role as unknown as Role,
    status: user.status as unknown as UserStatus,
    collegeId: user.collegeId ?? undefined,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString(),
  };
}
