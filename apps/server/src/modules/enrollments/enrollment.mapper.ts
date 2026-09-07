import type { EnrollmentDto } from '@forge-loom/shared-types';
import type { Enrollment, Course } from '@prisma/client';

export function toEnrollmentDto(enrollment: Enrollment, course: Course): EnrollmentDto {
  return {
    id: enrollment.id,
    courseId: course.id,
    course: {
      id: course.id,
      title: course.title,
      deliveryMode: course.deliveryMode,
      durationHours: course.durationHours,
      durationDays: course.durationDays,
      price: course.price.toNumber(),
      currency: course.currency,
    },
    status: enrollment.status,
    paymentRef: enrollment.paymentRef,
    paymentAmount: enrollment.paymentAmount.toNumber(),
    enrolledAt: enrollment.enrolledAt.toISOString(),
    completedAt: enrollment.completedAt ? enrollment.completedAt.toISOString() : null,
  };
}
