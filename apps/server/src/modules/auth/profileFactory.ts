import { Role } from '@forge-loom/shared-types';
import { prisma } from '../../config/prisma.js';

/**
 * Creates the role-specific profile row for a new account. `displayName` is
 * mapped to whichever field that role's table actually requires (student name,
 * company name, org name, ...) — roles with no required display field just get
 * an empty profile keyed by userId. `collegeId` is only meaningful for the
 * college-scoped roles, all of which are provisioned top-down (see
 * accountProvisioning.service.ts and college.service.ts's
 * createCollegeWithAdmin) rather than through self-registration.
 */
export async function createProfileForRole(
  role: Role,
  userId: string,
  displayName: string,
  collegeId?: string
): Promise<void> {
  switch (role) {
    case Role.Student:
      await prisma.studentProfile.create({ data: { userId, name: displayName, collegeId } });
      return;
    case Role.Mentor:
      await prisma.mentorProfile.create({ data: { userId, collegeId } });
      return;
    case Role.Trainer:
      await prisma.trainerProfile.create({ data: { userId, collegeId } });
      return;
    case Role.Speaker:
      await prisma.speakerProfile.create({ data: { userId } });
      return;
    case Role.Hr:
      await prisma.hrProfile.create({ data: { userId, companyName: displayName } });
      return;
    case Role.Sponsor:
      await prisma.sponsorProfile.create({ data: { userId, orgName: displayName } });
      return;
    case Role.CollegeAdmin:
      // Not exercised by any current call site — College Admin accounts are
      // always created via college.service.ts's createCollegeWithAdmin,
      // which creates the CollegeProfile itself inside the same transaction
      // as the College and the User. Kept here for switch exhaustiveness
      // over Role.
      await prisma.collegeProfile.create({
        data: { userId, collegeId: collegeId!, collegeName: displayName },
      });
      return;
    case Role.CommunityLeader:
      await prisma.communityLeaderProfile.create({ data: { userId, orgName: displayName } });
      return;
    case Role.MediaPartner:
      await prisma.mediaPartnerProfile.create({ data: { userId, outlet: displayName } });
      return;
    case Role.Member:
      await prisma.memberProfile.create({ data: { userId } });
      return;
    case Role.ForgeAdmin:
      // No profile table — internal superuser, never self-registered anyway.
      return;
    case Role.CourseAdmin:
      await prisma.courseAdminProfile.create({ data: { userId, name: displayName } });
      return;
  }
}
