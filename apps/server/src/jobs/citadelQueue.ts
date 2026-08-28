import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

export interface CheckInvestorUnlockJobData {
  teamId: string;
}

export const CITADEL_QUEUE_NAME = 'citadel';
export const CHECK_INVESTOR_UNLOCK_JOB = 'check-investor-unlock';

export const citadelQueue = new Queue<CheckInvestorUnlockJobData>(CITADEL_QUEUE_NAME, {
  connection: redis,
});

export async function enqueueInvestorUnlockCheck(teamId: string): Promise<void> {
  await citadelQueue.add(CHECK_INVESTOR_UNLOCK_JOB, { teamId });
}
