import { Worker, type Job } from 'bullmq';
import { redis } from '../config/redis.js';
import { prisma } from '../config/prisma.js';
import { SCORE_QUEUE_NAME, RECOMPUTE_SCORE_JOB, type RecomputeScoreJobData } from './scoreQueue.js';

type ScoreCategory = 'events' | 'project' | 'mentor' | 'team';

// builderScore = 0.2*events + 0.4*project + 0.3*mentor + 0.1*team, per the
// architecture doc §9 — computed here, never inline in a request handler.
const WEIGHTS: Record<ScoreCategory, number> = {
  events: 0.2,
  project: 0.4,
  mentor: 0.3,
  team: 0.1,
};

function capped(sum: number | null): number {
  return Math.min(100, sum ?? 0);
}

export async function recomputeBuilderScore(studentId: string): Promise<void> {
  // Mentor feedback is an average of ratings, not a sum — summing would
  // reward a student for accumulating many reviews rather than reviewing
  // well. `_sum`/`_avg` in one grouped aggregation query covers both needs
  // without fetching every event row.
  const grouped = await prisma.scoreEvent.groupBy({
    by: ['category'],
    where: { studentId },
    _sum: { points: true },
    _avg: { points: true },
  });

  const sumByCategory = new Map<ScoreCategory, number | null>(
    grouped.map((g) => [g.category as ScoreCategory, g._sum.points])
  );
  const avgByCategory = new Map<ScoreCategory, number | null>(
    grouped.map((g) => [g.category as ScoreCategory, g._avg.points])
  );

  const eventsScore = capped(sumByCategory.get('events') ?? null);
  const projectScore = capped(sumByCategory.get('project') ?? null);
  const mentorScore = avgByCategory.get('mentor') ?? 0;
  const teamScore = capped(sumByCategory.get('team') ?? null);

  const builderScore = Math.round(
    eventsScore * WEIGHTS.events +
      projectScore * WEIGHTS.project +
      mentorScore * WEIGHTS.mentor +
      teamScore * WEIGHTS.team
  );

  // StudentProfile has been Postgres-authoritative since Phase 1 of the
  // Prisma migration — this used to write to Mongo's StudentProfileModel,
  // which was correct until that phase moved StudentProfile off Mongo and
  // silently orphaned this write target. Fixed now, alongside ScoreEvent's
  // own move to Prisma, since the two were entangled (no event log to
  // recompute from until this phase). See docs/prisma-migration-tickets.md.
  await prisma.studentProfile.update({ where: { userId: studentId }, data: { builderScore } });
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
