import type { CommunityMemberDto } from '@forge-loom/shared-types';
import type { MemberRow } from './communityMember.service.js';

export function toCommunityMemberDto(row: MemberRow): CommunityMemberDto {
  return {
    userId: row.entry.userId.toString(),
    email: row.email,
    role: row.entry.role,
  };
}
