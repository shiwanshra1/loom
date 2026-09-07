import { Worker, type Job } from 'bullmq';
import { redis } from '../config/redis.js';
import { prisma } from '../config/prisma.js';
import { createNotification } from '../modules/notifications/notification.service.js';
import {
  CITADEL_QUEUE_NAME,
  CHECK_INVESTOR_UNLOCK_JOB,
  type CheckInvestorUnlockJobData,
} from './citadelQueue.js';

// The Citadel state machine's one automated rule: once a team's 3rd sprint
// cycle reaches `complete`, investor access is granted with no manual step.
export async function checkInvestorUnlock(teamId: string): Promise<void> {
  const alreadyGranted = await prisma.investorAccessGrant.findUnique({ where: { teamId } });
  if (alreadyGranted) {
    return;
  }

  const sprints = await prisma.sprint.findMany({ where: { teamId } });
  const allThreeComplete =
    sprints.length >= 3 && sprints.every((sprint) => sprint.status === 'complete');
  if (!allThreeComplete) {
    return;
  }

  await prisma.investorAccessGrant.create({
    data: { teamId, reason: '3 sprint cycles complete' },
  });

  const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
  if (team?.problemStatementId) {
    await prisma.problemStatement.update({
      where: { id: team.problemStatementId },
      data: { status: 'closed' },
    });
  }

  // Real notifications now that Phase 8 (of milestone-1.md) built the
  // collection — this used to be a console.log stand-in, disclosed as such
  // in Phase 7. `createNotification` silently no-ops for a Postgres-native
  // recipient id since Notification itself isn't on Prisma until Phase 5 of
  // the Postgres migration (docs/prisma-migration-tickets.md).
  const recipientIds = [
    ...(team?.members.map((m) => m.studentUserId) ?? []),
    ...(team?.mentorId ? [team.mentorId] : []),
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
