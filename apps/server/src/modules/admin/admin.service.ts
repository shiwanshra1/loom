import type { User } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import type { UpdateUserStatusInput } from './admin.validation.js';

export interface NationalStats {
  totalColleges: number;
  totalStudents: number;
  venturesLaunched: number;
  // No Placement data exists yet (schema-stub only, per milestone-1.md Phase
  // 10's own scope) — there is no real before/after employment signal to
  // compute a lift from, so this stays null rather than a fabricated number.
  employabilityLiftPercent: null;
}

export async function getNationalStats(): Promise<NationalStats> {
  const [totalColleges, totalStudents, venturesLaunched] = await Promise.all([
    prisma.college.count(),
    prisma.studentProfile.count(),
    prisma.investorAccessGrant.count(),
  ]);

  return { totalColleges, totalStudents, venturesLaunched, employabilityLiftPercent: null };
}

export interface UserRow {
  user: User;
  collegeName: string | null;
}

export async function listUsers(): Promise<UserRow[]> {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  const collegeIds = [
    ...new Set(users.map((u) => u.collegeId).filter((id): id is string => Boolean(id))),
  ];
  const colleges = await prisma.college.findMany({ where: { id: { in: collegeIds } } });
  const nameByCollegeId = new Map(colleges.map((c) => [c.id, c.name]));

  return users.map((user) => ({
    user,
    collegeName: user.collegeId ? (nameByCollegeId.get(user.collegeId) ?? null) : null,
  }));
}

export async function updateUserStatus(
  userId: string,
  input: UpdateUserStatusInput
): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return prisma.user.update({ where: { id: userId }, data: { status: input.status } });
}
