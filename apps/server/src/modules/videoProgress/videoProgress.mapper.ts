import type { VideoProgressDto } from '@forge-loom/shared-types';
import type { VideoProgressDocument } from '../../models/VideoProgress.js';

export function toVideoProgressDto(progress: VideoProgressDocument): VideoProgressDto {
  return {
    courseId: progress.courseId.toString(),
    dayNumber: progress.dayNumber,
    lastPositionSeconds: progress.lastPositionSeconds,
    durationSeconds: progress.durationSeconds,
    percentWatched: progress.percentWatched,
    completed: progress.completed,
    updatedAt: progress.updatedAt.toISOString(),
  };
}
