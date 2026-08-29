import type { HydratedDocument } from 'mongoose';
import {
  CommunityLeaderProfileModel,
  type CommunityLeaderProfileDocument,
  type CommunityMemberEntry,
} from '../../models/CommunityLeaderProfile.js';
import { UserModel } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import type { InviteCommunityMemberInput } from './communityMember.validation.js';

async function getOwnProfile(
  leaderUserId: string
): Promise<HydratedDocument<CommunityLeaderProfileDocument>> {
  const profile = await CommunityLeaderProfileModel.findOne({ userId: leaderUserId });
  if (!profile) {
    throw new ApiError(404, 'Community leader profile not found');
  }
  return profile;
}

// No email-invite infra exists in this roadmap — this adds an existing
// registered account to the member list rather than sending an actual invite.
export async function addMember(
  leaderUserId: string,
  input: InviteCommunityMemberInput
): Promise<CommunityMemberEntry[]> {
  const invitee = await UserModel.findOne({ email: input.email });
  if (!invitee) {
    throw new ApiError(404, `No account found for ${input.email}`);
  }

  const profile = await getOwnProfile(leaderUserId);
  const existing = profile.members.find((m) => m.userId.toString() === invitee._id.toString());
  if (existing) {
    existing.role = input.role ?? existing.role;
  } else {
    profile.members.push({ userId: invitee._id, role: input.role ?? 'public' });
  }
  await profile.save();
  return profile.members;
}

export interface MemberRow {
  entry: CommunityMemberEntry;
  email: string;
}

export async function listMembers(leaderUserId: string): Promise<MemberRow[]> {
  const profile = await getOwnProfile(leaderUserId);
  const users = await UserModel.find({ _id: { $in: profile.members.map((m) => m.userId) } });
  const emailByUserId = new Map(users.map((u) => [u._id.toString(), u.email]));

  return profile.members.map((entry) => ({
    entry,
    email: emailByUserId.get(entry.userId.toString()) ?? '',
  }));
}
