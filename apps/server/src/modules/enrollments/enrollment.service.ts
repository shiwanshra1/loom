import { CourseModel, type CourseDocument } from '../../models/Course.js';
import { EnrollmentModel, type EnrollmentDocument } from '../../models/Enrollment.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  type RazorpayOrder,
} from './razorpay.client.js';
import { ensureSessionsForCourse } from '../sessions/session.service.js';
import type { VerifyPaymentInput } from './enrollment.validation.js';

export interface EnrollmentWithCourse {
  enrollment: EnrollmentDocument;
  course: CourseDocument;
}

export interface EnrollmentWithOrder extends EnrollmentWithCourse {
  order: RazorpayOrder;
}

// A student can start a fresh purchase only once a prior enrollment in the
// same course was refunded — an active/completed enrollment blocks a second
// purchase outright (disclosed decision, roadmap left this to us). A
// `pending_payment` enrollment isn't blocking — it's reused (a fresh
// Razorpay order is issued against it) so an abandoned checkout can be retried.
const BLOCKED_REENROLL_STATUSES = ['active', 'completed'];

export async function createEnrollment(
  studentId: string,
  courseId: string
): Promise<EnrollmentWithOrder> {
  const course = await CourseModel.findOne({ _id: courseId, status: 'published' });
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const blocked = await EnrollmentModel.findOne({
    studentId,
    courseId,
    status: { $in: BLOCKED_REENROLL_STATUSES },
  });
  if (blocked) {
    throw new ApiError(409, 'You are already enrolled in this course');
  }

  const enrollment =
    (await EnrollmentModel.findOne({ studentId, courseId, status: 'pending_payment' })) ??
    (await EnrollmentModel.create({
      studentId,
      courseId,
      status: 'pending_payment',
      paymentAmount: course.price,
    }));

  const order = await createRazorpayOrder(
    Math.round(course.price * 100),
    course.currency,
    enrollment._id.toString()
  );
  enrollment.razorpayOrderId = order.id;
  await enrollment.save();

  return { enrollment, course, order };
}

export async function verifyEnrollmentPayment(
  enrollmentId: string,
  studentId: string,
  input: VerifyPaymentInput
): Promise<EnrollmentWithCourse> {
  const enrollment = await EnrollmentModel.findById(enrollmentId);
  if (!enrollment || enrollment.studentId.toString() !== studentId) {
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

  enrollment.status = 'active';
  enrollment.paymentRef = input.razorpayPaymentId;
  await enrollment.save();

  const course = await CourseModel.findById(enrollment.courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  // Offline courses get their session calendar materialized on first active
  // enrollment (Phase 3) — a no-op for online courses and for any course
  // that already has its sessions generated.
  await ensureSessionsForCourse(course);

  return { enrollment, course };
}

export async function listMyEnrollments(studentId: string): Promise<EnrollmentWithCourse[]> {
  const enrollments = await EnrollmentModel.find({ studentId }).sort({ createdAt: -1 });
  const courses = await CourseModel.find({ _id: { $in: enrollments.map((e) => e.courseId) } });
  const courseById = new Map(courses.map((course) => [course._id.toString(), course]));

  const rows: EnrollmentWithCourse[] = [];
  for (const enrollment of enrollments) {
    const course = courseById.get(enrollment.courseId.toString());
    if (course) {
      rows.push({ enrollment, course });
    }
  }
  return rows;
}
