import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { connectDb, disconnectDb } from './helpers.js';
import { recomputeBuilderScore } from '../jobs/scoreWorker.js';
import { ScoreEventModel } from '../models/ScoreEvent.js';
import { StudentProfileModel } from '../models/StudentProfile.js';
import { UserModel } from '../models/User.js';
import { Role } from '@forge-loom/shared-types';
import { hashPassword } from '../utils/password.js';
import { uniqueEmail } from './helpers.js';

beforeAll(async () => {
  await connectDb();
});

afterAll(async () => {
  await disconnectDb();
});

async function makeStudentProfile() {
  const user = await UserModel.create({
    email: uniqueEmail('score'),
    passwordHash: await hashPassword('irrelevant-for-this-test'),
    role: Role.Student,
  });
  await StudentProfileModel.create({ userId: user._id, name: 'Score Test Student' });
  return user._id.toString();
}

// builderScore = 0.2*events + 0.4*project + 0.3*mentor + 0.1*team
// (architecture doc §9), computed by summing/capping project|events|team at
// 100 but AVERAGING mentor ratings rather than summing them.
describe('score-recompute job', () => {
  it('matches the formula by hand for a realistic single-sprint-cycle student (documented in Phase 8: 43)', async () => {
    const studentId = await makeStudentProfile();
    await ScoreEventModel.create([
      { studentId, category: 'project', points: 100 / 3, reason: 'sprint cycle 1/3 complete' },
      { studentId, category: 'mentor', points: 100, reason: '5-star feedback' },
    ]);

    await recomputeBuilderScore(studentId);

    const profile = await StudentProfileModel.findOne({ userId: studentId });
    // 33.33*0.4 + 100*0.3 = 13.33 + 30 = 43.33 -> rounds to 43
    expect(profile?.builderScore).toBe(43);
  });

  it('averages mentor points across multiple reviews instead of summing them', async () => {
    const studentId = await makeStudentProfile();
    await ScoreEventModel.create([
      { studentId, category: 'mentor', points: 100, reason: '5-star' },
      { studentId, category: 'mentor', points: 60, reason: '3-star' },
    ]);

    await recomputeBuilderScore(studentId);

    const profile = await StudentProfileModel.findOne({ userId: studentId });
    // average(100, 60) = 80 -> 80*0.3 = 24
    expect(profile?.builderScore).toBe(24);
  });

  it('caps summed categories (project/events/team) at 100 even when points exceed it', async () => {
    const studentId = await makeStudentProfile();
    await ScoreEventModel.create([
      { studentId, category: 'project', points: 60, reason: 'a' },
      { studentId, category: 'project', points: 60, reason: 'b' },
    ]);

    await recomputeBuilderScore(studentId);

    const profile = await StudentProfileModel.findOne({ userId: studentId });
    // 120 capped to 100 -> 100*0.4 = 40
    expect(profile?.builderScore).toBe(40);
  });

  it('scores 0 for a student with no score events at all', async () => {
    const studentId = await makeStudentProfile();
    await recomputeBuilderScore(studentId);
    const profile = await StudentProfileModel.findOne({ userId: studentId });
    expect(profile?.builderScore).toBe(0);
  });
});
