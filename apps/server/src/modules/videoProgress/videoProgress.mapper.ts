import type { VideoProgressDto } from '@forge-loom/shared-types';
import type { VideoProgress } from '@prisma/client';

export function toVideoProgressDto(progress: VideoProgress): VideoProgressDto {
  return {
    courseId: progress.courseId,
    dayNumber: progress.dayNumber,
    lastPositionSeconds: progress.lastPositionSeconds,
    durationSeconds: progress.durationSeconds,
    percentWatched: progress.percentWatched,
    completed: progress.completed,
    updatedAt: progress.updatedAt.toISOString(),
  };
}
