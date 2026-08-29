import type { AdminUserRowDto } from '@forge-loom/shared-types';
import type { UserRow } from './admin.service.js';

export function toAdminUserRowDto(row: UserRow): AdminUserRowDto {
  return {
    id: row.user._id.toString(),
    email: row.user.email,
    role: row.user.role,
    collegeName: row.collegeName,
    status: row.user.status,
  };
}
