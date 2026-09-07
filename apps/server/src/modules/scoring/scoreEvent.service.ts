import type { ScoreCategory as PrismaScoreCategory } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { toPrismaEnum } from '../../utils/prismaEnum.js';
import { enqueueScoreRecompute } from '../../jobs/scoreQueue.js';

export type ScoreCategory = 'events' | 'project' | 'mentor' | 'team';

export async function recordScoreEvent(
  studentId: string,
  category: ScoreCategory,
  points: number,
  reason: string,
  sourceRef?: string
): Promise<void> {
  await prisma.scoreEvent.create({
    data: {
      studentId,
      category: toPrismaEnum<PrismaScoreCategory>(category),
      points,
      reason,
      sourceRef,
    },
  });
  // Async, off the request path — the worker recomputes builderScore from
  // the full event log, never synchronously inside this call.
  await enqueueScoreRecompute(studentId);
}
