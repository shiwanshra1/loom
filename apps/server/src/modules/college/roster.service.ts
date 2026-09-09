import { Role } from '@forge-loom/shared-types';
import type { BulkStudentRowInput, SendWelcomeEmailsAccountInput } from '@forge-loom/shared-types';
import type { Role as PrismaRole, User } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword } from '../../utils/password.js';
import { generateTempPassword } from '../../utils/generatePassword.js';
import { toPrismaEnum } from '../../utils/prismaEnum.js';
import { enqueueWelcomeEmail } from '../../jobs/welcomeEmailQueue.js';
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

export interface BulkCreateStudentRowResult {
  index: number;
  email: string;
  status: 'created' | 'error';
  error?: string;
  userId?: string;
  displayName?: string;
  tempPassword?: string;
}

// Deliberately sequential (not Promise.all) — each row's uniqueness checks
// need to see rows already created earlier in this same batch (both against
// the DB and against each other), and this is also what keeps a CSV's
// row-processing order predictable in the returned results. Each row's
// User + StudentProfile creation is one $transaction, so a mid-row failure
// (e.g. a rollNumber collision on the second insert) can never leave a
// login-capable User with no StudentProfile behind it.
export async function bulkCreateStudents(
  collegeId: string,
  rows: BulkStudentRowInput[]
): Promise<BulkCreateStudentRowResult[]> {
  const results: BulkCreateStudentRowResult[] = [];
  const seenEmails = new Set<string>();
  const seenRollNumbers = new Set<string>();

  for (const [index, row] of rows.entries()) {
    try {
      const normalizedEmail = row.email.toLowerCase();
      if (seenEmails.has(normalizedEmail)) {
        throw new ApiError(400, 'Duplicate email within this file');
      }
      if (row.rollNumber && seenRollNumbers.has(row.rollNumber)) {
        throw new ApiError(400, 'Duplicate roll number within this file');
      }

      const existing = await prisma.user.findUnique({ where: { email: row.email } });
      if (existing) {
        throw new ApiError(409, 'An account with this email already exists');
      }

      if (row.cohortId) {
        const cohort = await prisma.cohort.findUnique({ where: { id: row.cohortId } });
        if (!cohort || cohort.collegeId !== collegeId) {
          throw new ApiError(400, 'No batch found for the given cohortId at this college');
        }
      }

      const tempPassword = generateTempPassword();
      const passwordHash = await hashPassword(tempPassword);

      const user = await prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
          data: {
            email: row.email,
            passwordHash,
            role: toPrismaEnum<PrismaRole>(Role.Student),
            collegeId,
            mustChangePassword: true,
          },
        });
        await tx.studentProfile.create({
          data: {
            userId: createdUser.id,
            name: row.name,
            collegeId,
            cohortId: row.cohortId,
            rollNumber: row.rollNumber,
          },
        });
        return createdUser;
      });

      seenEmails.add(normalizedEmail);
      if (row.rollNumber) {
        seenRollNumbers.add(row.rollNumber);
      }

      results.push({
        index,
        email: row.email,
        status: 'created',
        userId: user.id,
        displayName: row.name,
        tempPassword,
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Could not create this account — check the row';
      results.push({ index, email: row.email, status: 'error', error: message });
    }
  }

  return results;
}

export interface SendWelcomeEmailsResult {
  sent: number;
  skipped: number;
}

// Trusts the caller's tempPassword/displayName rather than looking anything
// up server-side, because there is nothing to look up — passwords are never
// stored in plaintext, so the only place this data still exists is the
// bulk-create response the caller already has in hand. Still verifies each
// userId/email pair actually belongs to a real account at this college
// before enqueuing, so a malformed request can't be used to spam arbitrary
// addresses through the queue.
export async function sendWelcomeEmails(
  collegeId: string,
  accounts: SendWelcomeEmailsAccountInput[]
): Promise<SendWelcomeEmailsResult> {
  let sent = 0;
  let skipped = 0;

  for (const account of accounts) {
    const user = await prisma.user.findUnique({ where: { id: account.userId } });
    if (!user || user.collegeId !== collegeId || user.email !== account.email) {
      skipped += 1;
      continue;
    }

    await enqueueWelcomeEmail({
      userId: user.id,
      email: user.email,
      displayName: account.displayName,
      tempPassword: account.tempPassword,
    });
    sent += 1;
  }

  return { sent, skipped };
}
