import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

export interface RecomputeScoreJobData {
  studentId: string;
}

export const SCORE_QUEUE_NAME = 'score';
export const RECOMPUTE_SCORE_JOB = 'recompute-score';

export const scoreQueue = new Queue<RecomputeScoreJobData>(SCORE_QUEUE_NAME, {
  connection: redis,
});

export async function enqueueScoreRecompute(studentId: string): Promise<void> {
  await scoreQueue.add(RECOMPUTE_SCORE_JOB, { studentId });
}
