import type { CourseDeliveryMode } from './course.js';

export type EnrollmentStatus = 'pending_payment' | 'active' | 'completed' | 'refunded';

// A slim course projection embedded in an enrollment — enough for a
// dashboard/checkout card, not the full CourseDto (no syllabus, no admin-only
// fields). If a course detail page needs more later, fetch it separately.
export interface EnrollmentCourseSummaryDto {
  id: string;
  title: string;
  deliveryMode: CourseDeliveryMode;
  durationHours: number;
  durationDays: number;
  price: number;
  currency: string;
}

export interface EnrollmentDto {
  id: string;
  courseId: string;
  course: EnrollmentCourseSummaryDto;
  status: EnrollmentStatus;
  paymentRef: string | null;
  paymentAmount: number;
  enrolledAt: string;
  completedAt: string | null;
}
