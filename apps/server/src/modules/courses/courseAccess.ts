import { CourseAdminProfileModel } from '../../models/CourseAdminProfile.js';
import { CourseModel, type CourseDocument } from '../../models/Course.js';
import { EnrollmentModel } from '../../models/Enrollment.js';
import { ApiError } from '../../utils/ApiError.js';

// Shared by sessions, assessments, and the progress rollup — all three need
// the same "can this viewer see/manage this course" checks.

export async function requireCourse(courseId: string): Promise<CourseDocument> {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  return course;
}

export function isCourseTrainer(course: CourseDocument, userId: string): boolean {
  return Boolean(course.trainerId) && course.trainerId?.toString() === userId;
}

export async function isCourseAdminOwner(course: CourseDocument, userId: string): Promise<boolean> {
  const profile = await CourseAdminProfileModel.findOne({ userId });
  return Boolean(profile && course.createdBy.equals(profile._id));
}

export async function isEnrolledStudent(course: CourseDocument, userId: string): Promise<boolean> {
  return Boolean(
    await EnrollmentModel.exists({
      studentId: userId,
      courseId: course._id,
      status: { $in: ['active', 'completed'] },
    })
  );
}

export async function canViewCourse(
  course: CourseDocument,
  viewer: { userId: string }
): Promise<boolean> {
  return (
    isCourseTrainer(course, viewer.userId) ||
    (await isCourseAdminOwner(course, viewer.userId)) ||
    (await isEnrolledStudent(course, viewer.userId))
  );
}

export async function canManageCourseContent(
  course: CourseDocument,
  userId: string
): Promise<boolean> {
  return isCourseTrainer(course, userId) || (await isCourseAdminOwner(course, userId));
}
