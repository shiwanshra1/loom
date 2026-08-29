import { ScoreEventModel, type ScoreCategory } from '../../models/ScoreEvent.js';
import { enqueueScoreRecompute } from '../../jobs/scoreQueue.js';

export async function recordScoreEvent(
  studentId: string,
  category: ScoreCategory,
  points: number,
  reason: string,
  sourceRef?: string
): Promise<void> {
  await ScoreEventModel.create({ studentId, category, points, reason, sourceRef });
  // Async, off the request path — the worker recomputes builderScore from
  // the full event log, never synchronously inside this call.
  await enqueueScoreRecompute(studentId);
}
