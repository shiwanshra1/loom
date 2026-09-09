import type { Course, SyllabusDay } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';

// Shared by sessions, assessments, and the progress rollup — all three need
// the same "can this viewer see/manage this course" checks.

export type CourseWithSyllabus = Course & { syllabus: SyllabusDay[] };

const SYLLABUS_INCLUDE = { syllabus: { orderBy: { dayNumber: 'asc' as const } } };

export async function requireCourse(courseId: string): Promise<CourseWithSyllabus> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: SYLLABUS_INCLUDE,
  });
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  return course;
}

export function isCourseTrainer(course: Course, userId: string): boolean {
  return course.trainerId === userId;
}

export function isCourseAdminOwner(course: Course, userId: string): boolean {
  return course.createdBy === userId;
}

export async function isEnrolledStudent(course: Course, userId: string): Promise<boolean> {
  const count = await prisma.enrollment.count({
    where: { studentId: userId, courseId: course.id, status: { in: ['active', 'completed'] } },
  });
  return count > 0;
}

export async function canViewCourse(
  course: Course,
  viewer: { userId: string }
): Promise<boolean> {
  return (
    isCourseTrainer(course, viewer.userId) ||
    (await isCourseAdminOwner(course, viewer.userId)) ||
    (await isEnrolledStudent(course, viewer.userId))
  );
}

export async function canManageCourseContent(course: Course, userId: string): Promise<boolean> {
  return isCourseTrainer(course, userId) || (await isCourseAdminOwner(course, userId));
}
