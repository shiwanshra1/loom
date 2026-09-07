import type { CourseDto } from '@forge-loom/shared-types';
import type { CourseWithSyllabus } from './courseAccess.js';

export function toCourseDto(course: CourseWithSyllabus): CourseDto {
  return {
    id: course.id,
    title: course.title,
    description: course.description ?? undefined,
    deliveryMode: course.deliveryMode,
    durationHours: course.durationHours,
    durationDays: course.durationDays,
    price: course.price.toNumber(),
    currency: course.currency,
    status: course.status,
    syllabus: course.syllabus.map((day) => ({
      dayNumber: day.dayNumber,
      title: day.title,
      description: day.description ?? undefined,
      youtubeVideoId: day.youtubeVideoId ?? undefined,
    })),
    trainerId: course.trainerId ?? null,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  };
}
