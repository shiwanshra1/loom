import type { Types } from 'mongoose';
import { Role } from '@forge-loom/shared-types';
import {
  StudentProfileModel,
  MentorProfileModel,
  TrainerProfileModel,
  SpeakerProfileModel,
  HrProfileModel,
  SponsorProfileModel,
  CollegeProfileModel,
  CommunityLeaderProfileModel,
  MediaPartnerProfileModel,
  MemberProfileModel,
} from '../../models/index.js';

/**
 * Creates the role-specific profile document on registration. `displayName` is
 * mapped to whichever field that role's schema actually requires (student name,
 * company name, org name, ...) — roles with no required display field just get
 * an empty profile keyed by userId.
 */
export async function createProfileForRole(
  role: Role,
  userId: Types.ObjectId,
  displayName: string
): Promise<void> {
  switch (role) {
    case Role.Student:
      await StudentProfileModel.create({ userId, name: displayName });
      return;
    case Role.Mentor:
      await MentorProfileModel.create({ userId });
      return;
    case Role.Trainer:
      await TrainerProfileModel.create({ userId });
      return;
    case Role.Speaker:
      await SpeakerProfileModel.create({ userId });
      return;
    case Role.Hr:
      await HrProfileModel.create({ userId, companyName: displayName });
      return;
    case Role.Sponsor:
      await SponsorProfileModel.create({ userId, orgName: displayName });
      return;
    case Role.CollegeAdmin:
      await CollegeProfileModel.create({ userId, collegeName: displayName });
      return;
    case Role.CommunityLeader:
      await CommunityLeaderProfileModel.create({ userId, orgName: displayName });
      return;
    case Role.MediaPartner:
      await MediaPartnerProfileModel.create({ userId, outlet: displayName });
      return;
    case Role.Member:
      await MemberProfileModel.create({ userId });
      return;
    case Role.ForgeAdmin:
      // No profile collection — internal superuser, never self-registered anyway.
      return;
  }
}
