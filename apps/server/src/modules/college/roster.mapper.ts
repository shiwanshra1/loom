import type { CreateRosterMemberResultDto, Role, RosterStudentDto } from '@forge-loom/shared-types';
import { fromPrismaEnum } from '../../utils/prismaEnum.js';
import type { CreateRosterMemberResult, RosterStudentRow } from './roster.service.js';

export function toCreateRosterMemberResultDto(
  result: CreateRosterMemberResult
): CreateRosterMemberResultDto {
  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      role: fromPrismaEnum<Role>(result.user.role),
    },
    tempPassword: result.tempPassword,
  };
}

export function toRosterStudentDto(row: RosterStudentRow): RosterStudentDto {
  return { ...row };
}
