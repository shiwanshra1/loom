import mongoose from 'mongoose';
import { ScoreEventModel, type ScoreCategory } from '../../models/ScoreEvent.js';
import { enqueueScoreRecompute } from '../../jobs/scoreQueue.js';

// ScoreEvent isn't migrated until Phase 4 — `studentId` here is a strict
// Mongoose ObjectId cast. Callers upstream (sprints, migrated in Phase 3) now
// pass Postgres-native ids for any student created after that module's
// cutover, which aren't valid ObjectId hex. Guarded once here, same pattern
// as notification.service.ts's createNotification: silently skip recording
// the event (and the recompute it would trigger) for accounts this
// collection can't reference yet. Closes on its own once Phase 4 migrates
// ScoreEvent — and StudentProfile.builderScore's actual write target in
// jobs/scoreWorker.ts — together. See docs/prisma-migration-tickets.md.
export async function recordScoreEvent(
  studentId: string,
  category: ScoreCategory,
  points: number,
  reason: string,
  sourceRef?: string
): Promise<void> {
  if (!mongoose.isValidObjectId(studentId)) {
    return;
  }
  await ScoreEventModel.create({ studentId, category, points, reason, sourceRef });
  // Async, off the request path — the worker recomputes builderScore from
  // the full event log, never synchronously inside this call.
  await enqueueScoreRecompute(studentId);
}
