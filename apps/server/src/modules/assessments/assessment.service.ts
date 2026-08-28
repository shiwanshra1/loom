import { AssessmentModel, type AssessmentDocument } from '../../models/Assessment.js';
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
): Promise<AssessmentDocument> {
  const course = await requireCourse(courseId);
  if (!(await canManageCourseContent(course, viewer.userId))) {
    throw new ApiError(403, 'You do not have access to this course');
  }

  return AssessmentModel.create({
    courseId,
    title: input.title,
    type: input.type,
    scheduledDate: new Date(input.scheduledDate),
  });
}

export async function listAssessments(
  courseId: string,
  viewer: Viewer
): Promise<AssessmentDocument[]> {
  const course = await requireCourse(courseId);
  if (!(await canViewCourse(course, viewer))) {
    throw new ApiError(404, 'Course not found');
  }

  return AssessmentModel.find({ courseId }).sort({ scheduledDate: 1 });
}
