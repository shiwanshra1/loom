import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '@forge-loom/shared-types';
import { connectDb, disconnectDb, createTestUser } from './helpers.js';
import { recomputeBuilderScore } from '../jobs/scoreWorker.js';
import { prisma } from '../config/prisma.js';

beforeAll(async () => {
  await connectDb();
});

afterAll(async () => {
  await disconnectDb();
});

async function makeStudentProfile(): Promise<string> {
  const { user } = await createTestUser(Role.Student);
  await prisma.studentProfile.create({ data: { userId: user.id, name: 'Score Test Student' } });
  return user.id;
}

// builderScore = 0.2*events + 0.4*project + 0.3*mentor + 0.1*team
// (architecture doc §9), computed by summing/capping project|events|team at
// 100 but AVERAGING mentor ratings rather than summing them.
describe('score-recompute job', () => {
  it('matches the formula by hand for a realistic single-sprint-cycle student (documented in Phase 8: 43)', async () => {
    const studentId = await makeStudentProfile();
    await prisma.scoreEvent.createMany({
      data: [
        { studentId, category: 'project', points: 100 / 3, reason: 'sprint cycle 1/3 complete' },
        { studentId, category: 'mentor', points: 100, reason: '5-star feedback' },
      ],
    });

    await recomputeBuilderScore(studentId);

    const profile = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
    // 33.33*0.4 + 100*0.3 = 13.33 + 30 = 43.33 -> rounds to 43
    expect(profile?.builderScore).toBe(43);
  });

  it('averages mentor points across multiple reviews instead of summing them', async () => {
    const studentId = await makeStudentProfile();
    await prisma.scoreEvent.createMany({
      data: [
        { studentId, category: 'mentor', points: 100, reason: '5-star' },
        { studentId, category: 'mentor', points: 60, reason: '3-star' },
      ],
    });

    await recomputeBuilderScore(studentId);

    const profile = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
    // average(100, 60) = 80 -> 80*0.3 = 24
    expect(profile?.builderScore).toBe(24);
  });

  it('caps summed categories (project/events/team) at 100 even when points exceed it', async () => {
    const studentId = await makeStudentProfile();
    await prisma.scoreEvent.createMany({
      data: [
        { studentId, category: 'project', points: 60, reason: 'a' },
        { studentId, category: 'project', points: 60, reason: 'b' },
      ],
    });

    await recomputeBuilderScore(studentId);

    const profile = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
    // 120 capped to 100 -> 100*0.4 = 40
    expect(profile?.builderScore).toBe(40);
  });

  it('scores 0 for a student with no score events at all', async () => {
    const studentId = await makeStudentProfile();
    await recomputeBuilderScore(studentId);
    const profile = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
    expect(profile?.builderScore).toBe(0);
  });
});
