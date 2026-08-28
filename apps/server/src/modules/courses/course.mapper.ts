import type { CourseDto } from '@forge-loom/shared-types';
import type { CourseDocument } from '../../models/Course.js';

export function toCourseDto(course: CourseDocument): CourseDto {
  return {
    id: course._id.toString(),
    title: course.title,
    description: course.description,
    deliveryMode: course.deliveryMode,
    durationHours: course.durationHours,
    durationDays: course.durationDays,
    price: course.price,
    currency: course.currency,
    status: course.status,
    syllabus: course.syllabus.map((day) => ({
      dayNumber: day.dayNumber,
      title: day.title,
      description: day.description,
    })),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  };
}
