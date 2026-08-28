import { Worker, type Job } from 'bullmq';
import { redis } from '../config/redis.js';
import { SprintModel } from '../models/Sprint.js';
import { TeamModel } from '../models/Team.js';
import { ProblemStatementModel } from '../models/ProblemStatement.js';
import { InvestorAccessGrantModel } from '../models/InvestorAccessGrant.js';
import {
  CITADEL_QUEUE_NAME,
  CHECK_INVESTOR_UNLOCK_JOB,
  type CheckInvestorUnlockJobData,
} from './citadelQueue.js';

// The Citadel state machine's one automated rule: once a team's 3rd sprint
// cycle reaches `complete`, investor access is granted with no manual step.
// Notifications are a console log for now — a real `notifications` collection
// is explicitly Phase 8's job; this is a disclosed stand-in until then.
async function checkInvestorUnlock(teamId: string): Promise<void> {
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

  console.log(
    `[citadel] Investor access granted for team ${teamId} — team, mentor, and industry/investor accounts would be notified here.`
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
