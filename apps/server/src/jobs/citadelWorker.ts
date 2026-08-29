import { Worker, type Job } from 'bullmq';
import { redis } from '../config/redis.js';
import { SprintModel } from '../models/Sprint.js';
import { TeamModel } from '../models/Team.js';
import { ProblemStatementModel } from '../models/ProblemStatement.js';
import { InvestorAccessGrantModel } from '../models/InvestorAccessGrant.js';
import { createNotification } from '../modules/notifications/notification.service.js';
import {
  CITADEL_QUEUE_NAME,
  CHECK_INVESTOR_UNLOCK_JOB,
  type CheckInvestorUnlockJobData,
} from './citadelQueue.js';

// The Citadel state machine's one automated rule: once a team's 3rd sprint
// cycle reaches `complete`, investor access is granted with no manual step.
export async function checkInvestorUnlock(teamId: string): Promise<void> {
  const alreadyGranted = await InvestorAccessGrantModel.exists({ teamId });
  if (alreadyGranted) {
    return;
  }

  const sprints = await SprintModel.find({ teamId });
  const allThreeComplete =
    sprints.length >= 3 && sprints.every((sprint) => sprint.status === 'complete');
  if (!allThreeComplete) {
    return;
  }

  await InvestorAccessGrantModel.create({
    teamId,
    reason: '3 sprint cycles complete',
  });

  const team = await TeamModel.findById(teamId);
  if (team?.problemStatementId) {
    await ProblemStatementModel.updateOne({ _id: team.problemStatementId }, { status: 'closed' });
  }

  // Real notifications now that Phase 8 built the collection — this used to
  // be a console.log stand-in, disclosed as such in Phase 7.
  const recipientIds = [
    ...(team?.memberStudentIds.map((id) => id.toString()) ?? []),
    ...(team?.mentorId ? [team.mentorId.toString()] : []),
  ];
  await Promise.all(
    recipientIds.map((userId) =>
      createNotification(
        userId,
        'investor_access_granted',
        `${team?.name ?? 'Your team'} unlocked investor access!`,
        'All 3 sprint cycles are complete — investors can now view your team.'
      )
    )
  );
}

export function startCitadelWorker(): Worker<CheckInvestorUnlockJobData> {
  return new Worker<CheckInvestorUnlockJobData>(
    CITADEL_QUEUE_NAME,
    async (job: Job<CheckInvestorUnlockJobData>) => {
      if (job.name === CHECK_INVESTOR_UNLOCK_JOB) {
        await checkInvestorUnlock(job.data.teamId);
      }
    },
    { connection: redis }
  );
}
