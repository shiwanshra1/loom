import type { CommunityMember } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import type { InviteCommunityMemberInput } from './communityMember.validation.js';

async function getOwnProfileId(leaderUserId: string): Promise<string> {
  const profile = await prisma.communityLeaderProfile.findUnique({
    where: { userId: leaderUserId },
  });
  if (!profile) {
    throw new ApiError(404, 'Community leader profile not found');
  }
  return profile.id;
}

// No email-invite infra exists in this roadmap — this adds an existing
// registered account to the member list rather than sending an actual invite.
export async function addMember(
  leaderUserId: string,
  input: InviteCommunityMemberInput
): Promise<CommunityMember[]> {
  const invitee = await prisma.user.findUnique({ where: { email: input.email } });
  if (!invitee) {
    throw new ApiError(404, `No account found for ${input.email}`);
  }

  const communityLeaderProfileId = await getOwnProfileId(leaderUserId);

  await prisma.communityMember.upsert({
    where: { communityLeaderProfileId_userId: { communityLeaderProfileId, userId: invitee.id } },
    update: { role: input.role ?? 'public' },
    create: { communityLeaderProfileId, userId: invitee.id, role: input.role ?? 'public' },
  });

  return prisma.communityMember.findMany({ where: { communityLeaderProfileId } });
}

export interface MemberRow {
  entry: CommunityMember;
  email: string;
}

export async function listMembers(leaderUserId: string): Promise<MemberRow[]> {
  const communityLeaderProfileId = await getOwnProfileId(leaderUserId);
  const members = await prisma.communityMember.findMany({ where: { communityLeaderProfileId } });
  const users = await prisma.user.findMany({
    where: { id: { in: members.map((m) => m.userId) } },
  });
  const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

  return members.map((entry) => ({
    entry,
    email: emailByUserId.get(entry.userId) ?? '',
  }));
}
