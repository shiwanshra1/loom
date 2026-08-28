import type { EnrollmentDto } from '@forge-loom/shared-types';
import type { EnrollmentDocument } from '../../models/Enrollment.js';
import type { CourseDocument } from '../../models/Course.js';

export function toEnrollmentDto(
  enrollment: EnrollmentDocument,
  course: CourseDocument
): EnrollmentDto {
  return {
    id: enrollment._id.toString(),
    courseId: course._id.toString(),
    course: {
      id: course._id.toString(),
      title: course.title,
      deliveryMode: course.deliveryMode,
      durationHours: course.durationHours,
      durationDays: course.durationDays,
      price: course.price,
      currency: course.currency,
    },
    status: enrollment.status,
    paymentRef: enrollment.paymentRef,
    paymentAmount: enrollment.paymentAmount,
    enrolledAt: enrollment.enrolledAt.toISOString(),
    completedAt: enrollment.completedAt ? enrollment.completedAt.toISOString() : null,
  };
}
