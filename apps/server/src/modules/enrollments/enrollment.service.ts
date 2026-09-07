import type { Enrollment } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  type RazorpayOrder,
} from './razorpay.client.js';
import { ensureSessionsForCourse } from '../sessions/session.service.js';
import type { CourseWithSyllabus } from '../courses/courseAccess.js';
import type { VerifyPaymentInput } from './enrollment.validation.js';

export interface EnrollmentWithCourse {
  enrollment: Enrollment;
  course: CourseWithSyllabus;
}

export interface EnrollmentWithOrder extends EnrollmentWithCourse {
  order: RazorpayOrder;
}

const SYLLABUS_INCLUDE = { syllabus: { orderBy: { dayNumber: 'asc' as const } } };

// A student can start a fresh purchase only once a prior enrollment in the
// same course was refunded — an active/completed enrollment blocks a second
// purchase outright (disclosed decision, roadmap left this to us). A
// `pending_payment` enrollment isn't blocking — it's reused (a fresh
// Razorpay order is issued against it) so an abandoned checkout can be retried.
const BLOCKED_REENROLL_STATUSES = ['active', 'completed'] as const;

export async function createEnrollment(
  studentId: string,
  courseId: string
): Promise<EnrollmentWithOrder> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, status: 'published' },
    include: SYLLABUS_INCLUDE,
  });
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const blocked = await prisma.enrollment.findFirst({
    where: { studentId, courseId, status: { in: [...BLOCKED_REENROLL_STATUSES] } },
  });
  if (blocked) {
    throw new ApiError(409, 'You are already enrolled in this course');
  }

  let enrollment = await prisma.enrollment.findFirst({
    where: { studentId, courseId, status: 'pending_payment' },
  });
  if (!enrollment) {
    enrollment = await prisma.enrollment.create({
      data: { studentId, courseId, status: 'pending_payment', paymentAmount: course.price },
    });
  }

  const order = await createRazorpayOrder(
    Math.round(course.price.toNumber() * 100),
    course.currency,
    enrollment.id
  );
  enrollment = await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { razorpayOrderId: order.id },
  });

  return { enrollment, course, order };
}

export async function verifyEnrollmentPayment(
  enrollmentId: string,
  studentId: string,
  input: VerifyPaymentInput
): Promise<EnrollmentWithCourse> {
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment || enrollment.studentId !== studentId) {
    throw new ApiError(404, 'Enrollment not found');
  }
  if (enrollment.status !== 'pending_payment') {
    throw new ApiError(400, 'This enrollment is not awaiting payment');
  }
  if (enrollment.razorpayOrderId !== input.razorpayOrderId) {
    throw new ApiError(400, 'Order does not match this enrollment');
  }

  const valid = verifyRazorpaySignature(
    input.razorpayOrderId,
    input.razorpayPaymentId,
    input.razorpaySignature
  );
  if (!valid) {
    throw new ApiError(400, 'Payment verification failed');
  }

  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: 'active', paymentRef: input.razorpayPaymentId },
  });

  const course = await prisma.course.findUnique({
    where: { id: updated.courseId },
    include: SYLLABUS_INCLUDE,
  });
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  // Offline courses get their session calendar materialized on first active
  // enrollment (Phase 3) — a no-op for online courses and for any course
  // that already has its sessions generated.
  await ensureSessionsForCourse(course);

  return { enrollment: updated, course };
}

export async function listMyEnrollments(studentId: string): Promise<EnrollmentWithCourse[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });
  const courses = await prisma.course.findMany({
    where: { id: { in: enrollments.map((e) => e.courseId) } },
    include: SYLLABUS_INCLUDE,
  });
  const courseById = new Map(courses.map((course) => [course.id, course]));

  const rows: EnrollmentWithCourse[] = [];
  for (const enrollment of enrollments) {
    const course = courseById.get(enrollment.courseId);
    if (course) {
      rows.push({ enrollment, course });
    }
  }
  return rows;
}
