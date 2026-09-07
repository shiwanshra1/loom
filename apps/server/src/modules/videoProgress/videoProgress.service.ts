import type { VideoProgress } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import type { UpsertVideoProgressInput } from './videoProgress.validation.js';

// >=90% watched counts as "completed" — the roadmap floated this exact
// threshold as the natural default; adopted as-is rather than inventing one.
const COMPLETION_THRESHOLD_PERCENT = 90;

export async function upsertVideoProgress(
  studentId: string,
  input: UpsertVideoProgressInput
): Promise<VideoProgress> {
  const course = await prisma.course.findUnique({
    where: { id: input.courseId },
    include: { syllabus: true },
  });
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const enrolledCount = await prisma.enrollment.count({
    where: { studentId, courseId: input.courseId, status: { in: ['active', 'completed'] } },
  });
  if (enrolledCount === 0) {
    throw new ApiError(403, 'You are not enrolled in this course');
  }

  const day = course.syllabus.find((d) => d.dayNumber === input.dayNumber);
  if (!day) {
    throw new ApiError(404, `No syllabus day ${input.dayNumber} on this course`);
  }

  const percentWatched =
    input.durationSeconds > 0
      ? Math.min(100, Math.round((input.positionSeconds / input.durationSeconds) * 100))
      : 0;

  return prisma.videoProgress.upsert({
    where: {
      studentId_courseId_dayNumber: {
        studentId,
        courseId: input.courseId,
        dayNumber: input.dayNumber,
      },
    },
    update: {
      lastPositionSeconds: input.positionSeconds,
      durationSeconds: input.durationSeconds,
      percentWatched,
      completed: percentWatched >= COMPLETION_THRESHOLD_PERCENT,
    },
    create: {
      studentId,
      courseId: input.courseId,
      dayNumber: input.dayNumber,
      lastPositionSeconds: input.positionSeconds,
      durationSeconds: input.durationSeconds,
      percentWatched,
      completed: percentWatched >= COMPLETION_THRESHOLD_PERCENT,
    },
  });
}

export async function listVideoProgress(
  studentId: string,
  courseId: string
): Promise<VideoProgress[]> {
  return prisma.videoProgress.findMany({ where: { studentId, courseId } });
}
