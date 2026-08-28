import { CourseModel, type CourseDocument } from '../../models/Course.js';
import { EnrollmentModel, type EnrollmentDocument } from '../../models/Enrollment.js';
import { ApiError } from '../../utils/ApiError.js';
import { processPayment } from './payment.stub.js';

export interface EnrollmentWithCourse {
  enrollment: EnrollmentDocument;
  course: CourseDocument;
}

// A student can re-enroll only once a prior enrollment in the same course was
// refunded — an existing pending/active/completed enrollment blocks a second
// purchase outright (disclosed decision, roadmap left this to us).
const BLOCKED_REENROLL_STATUSES = ['pending_payment', 'active', 'completed'];

export async function createEnrollment(
  studentId: string,
  courseId: string
): Promise<EnrollmentWithCourse> {
  const course = await CourseModel.findOne({ _id: courseId, status: 'published' });
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }

  const existing = await EnrollmentModel.findOne({
    studentId,
    courseId,
    status: { $in: BLOCKED_REENROLL_STATUSES },
  });
  if (existing) {
    throw new ApiError(409, 'You are already enrolled in this course');
  }

  const enrollment = await EnrollmentModel.create({
    studentId,
    courseId,
    status: 'pending_payment',
    paymentAmount: course.price,
  });

  // Stubbed payment always succeeds today — this is the seam where a real
  // Razorpay order/verify step slots in without restructuring the flow above.
  const payment = await processPayment(enrollment);
  enrollment.status = 'active';
  enrollment.paymentRef = payment.paymentRef;
  await enrollment.save();

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
