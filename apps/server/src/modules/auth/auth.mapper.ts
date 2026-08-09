import type { PublicUser } from '@forge-loom/shared-types';
import type { UserDocument } from '../../models/User.js';

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    status: user.status,
    collegeId: user.collegeId?.toString(),
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString(),
  };
}
