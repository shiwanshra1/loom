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
  CourseAdminProfileModel,
} from '../../models/index.js';

/**
 * Creates the role-specific profile document on registration. `displayName` is
 * mapped to whichever field that role's schema actually requires (student name,
 * company name, org name, ...) — roles with no required display field just get
 * an empty profile keyed by userId. `collegeId` is only meaningful (and only
 * ever passed) for the college-scoped roles — see collegeProvisioning.ts.
 */
export async function createProfileForRole(
  role: Role,
  userId: Types.ObjectId,
  displayName: string,
  collegeId?: Types.ObjectId
): Promise<void> {
  switch (role) {
    case Role.Student:
      await StudentProfileModel.create({ userId, name: displayName, collegeId });
      return;
    case Role.Mentor:
      await MentorProfileModel.create({ userId, collegeId });
      return;
    case Role.Trainer:
      await TrainerProfileModel.create({ userId, collegeId });
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
      // collegeId is always set for this role by the time we get here — it's
      // the College this admin just founded (see collegeProvisioning.ts).
      await CollegeProfileModel.create({ userId, collegeId: collegeId!, collegeName: displayName });
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
    case Role.CourseAdmin:
      await CourseAdminProfileModel.create({ userId, name: displayName });
      return;
  }
}
