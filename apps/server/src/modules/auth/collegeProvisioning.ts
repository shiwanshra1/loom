import { COLLEGE_SCOPED_ROLES, Role } from '@forge-loom/shared-types';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * Resolves the collegeId a new user should get at registration time — shared
 * between the real register endpoint and the dev seed script so both go
 * through the identical rule:
 * - college_admin founds a brand-new College (their displayName becomes its
 *   name) — there's no "pick an existing college" flow for this role.
 * - student/mentor/trainer must pick an existing college's id; it's
 *   validated to actually exist rather than trusted as an opaque string.
 * - every other role is not college-scoped and gets no collegeId.
 */
export async function resolveCollegeIdForRegistration(
  role: Role,
  displayName: string,
  providedCollegeId?: string
): Promise<string | undefined> {
  if (role === Role.CollegeAdmin) {
    const college = await prisma.college.create({
      data: { name: displayName, partnerTier: 'bronze' },
    });
    return college.id;
  }

  if (COLLEGE_SCOPED_ROLES.includes(role)) {
    if (!providedCollegeId) {
      throw new ApiError(400, 'collegeId is required for this role');
    }
    const college = await prisma.college.findUnique({ where: { id: providedCollegeId } });
    if (!college) {
      throw new ApiError(400, 'No college found for the given collegeId');
    }
    return college.id;
  }

  return undefined;
}
