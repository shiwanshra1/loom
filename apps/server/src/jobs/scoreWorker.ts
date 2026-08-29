import { Worker, type Job } from 'bullmq';
import { redis } from '../config/redis.js';
import { ScoreEventModel, type ScoreCategory } from '../models/ScoreEvent.js';
import { StudentProfileModel } from '../models/StudentProfile.js';
import { SCORE_QUEUE_NAME, RECOMPUTE_SCORE_JOB, type RecomputeScoreJobData } from './scoreQueue.js';

// builderScore = 0.2*events + 0.4*project + 0.3*mentor + 0.1*team, per the
// architecture doc §9 — computed here, never inline in a request handler.
const WEIGHTS: Record<ScoreCategory, number> = {
  events: 0.2,
  project: 0.4,
  mentor: 0.3,
  team: 0.1,
};

function sumCapped(points: number[]): number {
  return Math.min(
    100,
    points.reduce((sum, p) => sum + p, 0)
  );
}

// Mentor feedback is an average of ratings, not a sum — summing would reward
// a student for accumulating many reviews rather than reviewing well.
function average(points: number[]): number {
  return points.length > 0 ? points.reduce((sum, p) => sum + p, 0) / points.length : 0;
}

export async function recomputeBuilderScore(studentId: string): Promise<void> {
  const events = await ScoreEventModel.find({ studentId });
  const byCategory: Record<ScoreCategory, number[]> = {
    events: [],
    project: [],
    mentor: [],
    team: [],
  };
  for (const event of events) {
    byCategory[event.category].push(event.points);
  }

  const eventsScore = sumCapped(byCategory.events);
  const projectScore = sumCapped(byCategory.project);
  const mentorScore = average(byCategory.mentor);
  const teamScore = sumCapped(byCategory.team);

  const builderScore = Math.round(
    eventsScore * WEIGHTS.events +
      projectScore * WEIGHTS.project +
      mentorScore * WEIGHTS.mentor +
      teamScore * WEIGHTS.team
  );

  await StudentProfileModel.updateOne({ userId: studentId }, { builderScore });
}

export function startScoreWorker(): Worker<RecomputeScoreJobData> {
  return new Worker<RecomputeScoreJobData>(
    SCORE_QUEUE_NAME,
    async (job: Job<RecomputeScoreJobData>) => {
      if (job.name === RECOMPUTE_SCORE_JOB) {
        await recomputeBuilderScore(job.data.studentId);
      }
    },
    { connection: redis }
  );
}
