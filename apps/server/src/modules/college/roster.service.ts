import { Role } from '@forge-loom/shared-types';
import type { User } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { createAdminManagedAccount } from '../admin/accountProvisioning.service.js';
import type { CreateRosterMemberInput, UpdateStudentBatchInput } from './roster.validation.js';

export type RosterRole = typeof Role.Student | typeof Role.Mentor | typeof Role.Trainer;

export interface CreateRosterMemberResult {
  user: User;
  tempPassword: string;
}

// A College Admin's single admin-created account — funnels through the same
// createAdminManagedAccount as Forge Admin peer creation (Phase 4), just with
// collegeId forced from the caller's own session rather than left unset.
export async function createRosterMember(
  role: RosterRole,
  collegeId: string,
  input: CreateRosterMemberInput
): Promise<CreateRosterMemberResult> {
  return createAdminManagedAccount({
    role,
    email: input.email,
    displayName: input.displayName,
    collegeId,
  });
}

export interface RosterStudentRow {
  userId: string;
  email: string;
  name: string;
  rollNumber: string | null;
  cohortId: string | null;
  cohortName: string | null;
}

export async function listStudents(collegeId: string): Promise<RosterStudentRow[]> {
  const students = await prisma.studentProfile.findMany({
    where: { collegeId },
    orderBy: { name: 'asc' },
  });

  const userIds = students.map((s) => s.userId);
  const cohortIds = [
    ...new Set(students.map((s) => s.cohortId).filter((id): id is string => Boolean(id))),
  ];

  const [users, cohorts] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds } } }),
    prisma.cohort.findMany({ where: { id: { in: cohortIds } } }),
  ]);

  const emailByUserId = new Map(users.map((u) => [u.id, u.email]));
  const cohortNameById = new Map(cohorts.map((c) => [c.id, c.name]));

  return students.map((s) => ({
    userId: s.userId,
    email: emailByUserId.get(s.userId) ?? '',
    name: s.name,
    rollNumber: s.rollNumber,
    cohortId: s.cohortId,
    cohortName: s.cohortId ? cohortNameById.get(s.cohortId) ?? null : null,
  }));
}

export async function updateStudentBatch(
  collegeId: string,
  studentUserId: string,
  input: UpdateStudentBatchInput
): Promise<RosterStudentRow> {
  const profile = await prisma.studentProfile.findUnique({ where: { userId: studentUserId } });
  if (!profile || profile.collegeId !== collegeId) {
    throw new ApiError(404, 'Student not found at this college');
  }

  if (input.cohortId) {
    const cohort = await prisma.cohort.findUnique({ where: { id: input.cohortId } });
    if (!cohort || cohort.collegeId !== collegeId) {
      throw new ApiError(400, 'No batch found for the given cohortId at this college');
    }
  }

  const updated = await prisma.studentProfile.update({
    where: { userId: studentUserId },
    data: { cohortId: input.cohortId },
  });

  const [user, cohort] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: studentUserId } }),
    updated.cohortId ? prisma.cohort.findUnique({ where: { id: updated.cohortId } }) : null,
  ]);

  return {
    userId: updated.userId,
    email: user.email,
    name: updated.name,
    rollNumber: updated.rollNumber,
    cohortId: updated.cohortId,
    cohortName: cohort?.name ?? null,
  };
}
