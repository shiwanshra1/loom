import type { Assessment } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { canManageCourseContent, canViewCourse, requireCourse } from '../courses/courseAccess.js';
import type { CreateAssessmentInput } from './assessment.validation.js';

interface Viewer {
  userId: string;
  role: string;
}

export async function createAssessment(
  courseId: string,
  viewer: Viewer,
  input: CreateAssessmentInput
): Promise<Assessment> {
  const course = await requireCourse(courseId);
  if (!(await canManageCourseContent(course, viewer.userId))) {
    throw new ApiError(403, 'You do not have access to this course');
  }

  return prisma.assessment.create({
    data: {
      courseId,
      title: input.title,
      type: input.type,
      scheduledDate: new Date(input.scheduledDate),
    },
  });
}

export async function listAssessments(courseId: string, viewer: Viewer): Promise<Assessment[]> {
  const course = await requireCourse(courseId);
  if (!(await canViewCourse(course, viewer))) {
    throw new ApiError(404, 'Course not found');
  }

  return prisma.assessment.findMany({ where: { courseId }, orderBy: { scheduledDate: 'asc' } });
}
