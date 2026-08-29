import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Role } from '@forge-loom/shared-types';
import { connectDb, disconnectDb, createTestUser } from './helpers.js';
import { checkInvestorUnlock } from '../jobs/citadelWorker.js';
import { CollegeModel } from '../models/College.js';
import { TeamModel } from '../models/Team.js';
import { SprintModel } from '../models/Sprint.js';
import { ProblemStatementModel } from '../models/ProblemStatement.js';
import { InvestorAccessGrantModel } from '../models/InvestorAccessGrant.js';
import { NotificationModel } from '../models/Notification.js';

// Unit-tests the worker's actual business logic directly (the piece a silent
// regression would actually break) rather than round-tripping through a real
// BullMQ queue — that would only be re-testing BullMQ's own delivery
// guarantees, which are already covered by that library's own test suite.
beforeAll(async () => {
  await connectDb();
});

afterAll(async () => {
  await disconnectDb();
});

async function makeTeamWithSprints(sprintStatuses: string[]) {
  const college = await CollegeModel.create({ name: 'Citadel Test College' });
  const { user: student } = await createTestUser(Role.Student);
  const { user: mentor } = await createTestUser(Role.Mentor);
  const problemStatement = await ProblemStatementModel.create({
    title: 'Test Problem',
    description: 'desc',
    source: 'internal',
    domain: 'General',
    teamSize: 1,
    durationWeeks: 6,
    difficulty: 'medium',
    status: 'open',
  });
  const team = await TeamModel.create({
    name: 'Citadel Test Team',
    collegeId: college._id,
    memberStudentIds: [student._id],
    mentorId: mentor._id,
    problemStatementId: problemStatement._id,
  });

  const now = new Date();
  await SprintModel.insertMany(
    sprintStatuses.map((status, i) => ({
      teamId: team._id,
      cycleNumber: i + 1,
      status,
      startDate: now,
      endDate: now,
      tasks: [],
      progressPercent: status === 'complete' ? 100 : 0,
    }))
  );

  return { team, problemStatement, studentId: student._id.toString() };
}

describe('Citadel 3-sprint investor-unlock job', () => {
  it('does not grant access when fewer than 3 sprints are complete', async () => {
    const { team, problemStatement } = await makeTeamWithSprints([
      'complete',
      'complete',
      'reviewed',
    ]);

    await checkInvestorUnlock(team._id.toString());

    const grant = await InvestorAccessGrantModel.findOne({ teamId: team._id });
    expect(grant).toBeNull();
    const refreshedPs = await ProblemStatementModel.findById(problemStatement._id);
    expect(refreshedPs?.status).toBe('open');
  });

  it('grants investor access, closes the problem statement, and notifies the team exactly once all 3 sprints complete', async () => {
    const { team, problemStatement, studentId } = await makeTeamWithSprints([
      'complete',
      'complete',
      'complete',
    ]);

    await checkInvestorUnlock(team._id.toString());

    const grant = await InvestorAccessGrantModel.findOne({ teamId: team._id });
    expect(grant).not.toBeNull();
    expect(grant?.reason).toBe('3 sprint cycles complete');

    const refreshedPs = await ProblemStatementModel.findById(problemStatement._id);
    expect(refreshedPs?.status).toBe('closed');

    const notification = await NotificationModel.findOne({
      userId: studentId,
      type: 'investor_access_granted',
    });
    expect(notification).not.toBeNull();

    // Idempotency: running it again (e.g. a duplicate job) must not create a second grant.
    await checkInvestorUnlock(team._id.toString());
    const grantCount = await InvestorAccessGrantModel.countDocuments({ teamId: team._id });
    expect(grantCount).toBe(1);
  });
});
