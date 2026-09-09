import type { AdminUserRowDto, ForgeAdminDto, Role, UserStatus } from '@forge-loom/shared-types';
import type { User } from '@prisma/client';
import { fromPrismaEnum } from '../../utils/prismaEnum.js';
import type { UserRow } from './admin.service.js';

export function toAdminUserRowDto(row: UserRow): AdminUserRowDto {
  return {
    id: row.user.id,
    email: row.user.email,
    role: fromPrismaEnum<Role>(row.user.role),
    collegeName: row.collegeName,
    status: fromPrismaEnum<UserStatus>(row.user.status),
  };
}

export function toForgeAdminDto(user: User): ForgeAdminDto {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}
