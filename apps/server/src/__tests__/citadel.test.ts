import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '@forge-loom/shared-types';
import type { SprintStatus } from '@prisma/client';
import { connectDb, disconnectDb, connectPrisma, disconnectPrisma, createTestUserPg } from './helpers.js';
import { prisma } from '../config/prisma.js';
import { checkInvestorUnlock } from '../jobs/citadelWorker.js';

// Unit-tests the worker's actual business logic directly (the piece a silent
// regression would actually break) rather than round-tripping through a real
// BullMQ queue — that would only be re-testing BullMQ's own delivery
// guarantees, which are already covered by that library's own test suite.
beforeAll(async () => {
  await connectDb();
  await connectPrisma();
});

afterAll(async () => {
  await disconnectDb();
  await disconnectPrisma();
});

async function makeTeamWithSprints(sprintStatuses: SprintStatus[]) {
  const college = await prisma.college.create({ data: { name: 'Citadel Test College' } });
  const { user: student } = await createTestUserPg(Role.Student);
  const { user: mentor } = await createTestUserPg(Role.Mentor);
  const studentProfile = await prisma.studentProfile.create({
    data: { userId: student.id, name: 'Citadel Test Student', collegeId: college.id },
  });
  const problemStatement = await prisma.problemStatement.create({
    data: {
      title: 'Test Problem',
      description: 'desc',
      source: 'internal',
      domain: 'General',
      teamSize: 1,
      durationWeeks: 6,
      difficulty: 'medium',
      status: 'open',
    },
  });
  const team = await prisma.team.create({
    data: {
      name: 'Citadel Test Team',
      collegeId: college.id,
      mentorId: mentor.id,
      problemStatementId: problemStatement.id,
      members: { create: [{ studentUserId: student.id, studentProfileId: studentProfile.id }] },
    },
  });

  const now = new Date();
  await prisma.sprint.createMany({
    data: sprintStatuses.map((status, i) => ({
      teamId: team.id,
      cycleNumber: i + 1,
      status,
      startDate: now,
      endDate: now,
      progressPercent: status === 'complete' ? 100 : 0,
    })),
  });

  return { team, problemStatement, studentId: student.id };
}

describe('Citadel 3-sprint investor-unlock job', () => {
  it('does not grant access when fewer than 3 sprints are complete', async () => {
    const { team, problemStatement } = await makeTeamWithSprints([
      'complete',
      'complete',
      'reviewed',
    ]);

    await checkInvestorUnlock(team.id);

    const grant = await prisma.investorAccessGrant.findUnique({ where: { teamId: team.id } });
    expect(grant).toBeNull();
    const refreshedPs = await prisma.problemStatement.findUnique({ where: { id: problemStatement.id } });
    expect(refreshedPs?.status).toBe('open');
  });

  it('grants investor access, closes the problem statement, and is idempotent, exactly once all 3 sprints complete', async () => {
    const { team, problemStatement } = await makeTeamWithSprints(['complete', 'complete', 'complete']);

    await checkInvestorUnlock(team.id);

    const grant = await prisma.investorAccessGrant.findUnique({ where: { teamId: team.id } });
    expect(grant).not.toBeNull();
    expect(grant?.reason).toBe('3 sprint cycles complete');

    const refreshedPs = await prisma.problemStatement.findUnique({ where: { id: problemStatement.id } });
    expect(refreshedPs?.status).toBe('closed');

    // Notification itself isn't migrated to Prisma until Phase 5
    // (docs/prisma-migration-tickets.md) — createNotification silently
    // no-ops for a Postgres-native recipient id in the meantime (the same
    // disclosed gap pattern as Phase 2/3's other guards), so there's no
    // Mongo Notification document to assert on here anymore. What's still
    // verified: the call didn't throw, and the grant/problem-statement side
    // effects above are correct.

    // Idempotency: running it again (e.g. a duplicate job) must not create a second grant.
    await checkInvestorUnlock(team.id);
    const grantCount = await prisma.investorAccessGrant.count({ where: { teamId: team.id } });
    expect(grantCount).toBe(1);
  });
});
