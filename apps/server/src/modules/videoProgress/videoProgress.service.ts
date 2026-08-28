import { CourseModel } from '../../models/Course.js';
import { EnrollmentModel } from '../../models/Enrollment.js';
import { VideoProgressModel, type VideoProgressDocument } from '../../models/VideoProgress.js';
import { ApiError } from '../../utils/ApiError.js';
import type { UpsertVideoProgressInput } from './videoProgress.validation.js';

// >=90% watched counts as "completed" — the roadmap floated this exact
// threshold as the natural default; adopted as-is rather than inventing one.
const COMPLETION_THRESHOLD_PERCENT = 90;

export async function upsertVideoProgress(
  studentId: string,
  input: UpsertVideoProgressInput
): Promise<VideoProgressDocument> {
  const course = await CourseModel.findById(input.courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const enrolled = await EnrollmentModel.exists({
    studentId,
    courseId: input.courseId,
    status: { $in: ['active', 'completed'] },
  });
  if (!enrolled) {
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

  const updated = await VideoProgressModel.findOneAndUpdate(
    { studentId, courseId: input.courseId, dayNumber: input.dayNumber },
    {
      lastPositionSeconds: input.positionSeconds,
      durationSeconds: input.durationSeconds,
      percentWatched,
      completed: percentWatched >= COMPLETION_THRESHOLD_PERCENT,
    },
    { upsert: true, new: true }
  );
  // `upsert: true` guarantees a document; the `| null` in the type is only
  // there for the non-upsert case.
  return updated!;
}

export async function listVideoProgress(
  studentId: string,
  courseId: string
): Promise<VideoProgressDocument[]> {
  return VideoProgressModel.find({ studentId, courseId });
}
