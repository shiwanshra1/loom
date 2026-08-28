export interface VideoProgressDto {
  courseId: string;
  dayNumber: number;
  lastPositionSeconds: number;
  durationSeconds: number;
  percentWatched: number;
  completed: boolean;
  updatedAt: string;
}
