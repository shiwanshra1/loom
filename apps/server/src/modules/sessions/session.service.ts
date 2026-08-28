import { CourseAdminProfileModel } from '../../models/CourseAdminProfile.js';
import { CourseModel, type CourseDocument } from '../../models/Course.js';
import { CourseSessionModel, type CourseSessionDocument } from '../../models/CourseSession.js';
import { AttendanceRecordModel } from '../../models/AttendanceRecord.js';
import { EnrollmentModel } from '../../models/Enrollment.js';
import { UserModel } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import type { MarkAttendanceInput, UpdateSessionInput } from './session.validation.js';

// Sessions only materialize for offline courses — online courses are tracked
// via Phase 4's per-video watch progress instead of attendance. Called once,
// idempotently, the first time a course gets its first active enrollment;
// since there's no cohort/batch concept yet (that's Phase 6), this treats the
// whole course as a single implicit cohort starting "today."
export async function ensureSessionsForCourse(course: CourseDocument): Promise<void> {
  if (course.deliveryMode !== 'offline') {
    return;
  }

  const existing = await CourseSessionModel.countDocuments({ courseId: course._id });
  if (existing > 0) {
    return;
  }

  const baseDate = new Date();
  const sessions = course.syllabus.map((day) => {
    const scheduledDate = new Date(baseDate);
    scheduledDate.setDate(scheduledDate.getDate() + (day.dayNumber - 1));
    return {
      courseId: course._id,
      dayNumber: day.dayNumber,
      scheduledDate,
      mode: 'offline' as const,
      status: 'scheduled' as const,
      cancelReason: null,
      trainerId: course.trainerId,
    };
  });

  if (sessions.length > 0) {
    await CourseSessionModel.insertMany(sessions);
  }
}

async function requireCourse(courseId: string): Promise<CourseDocument> {
  const course = await CourseModel.findById(courseId);
  if (!course) {
    throw new ApiError(404, 'Course not found');
  }
  return course;
}

function isCourseTrainer(course: CourseDocument, trainerUserId: string): boolean {
  return Boolean(course.trainerId) && course.trainerId?.toString() === trainerUserId;
}

async function isCourseAdminOwner(course: CourseDocument, userId: string): Promise<boolean> {
  const profile = await CourseAdminProfileModel.findOne({ userId });
  return Boolean(profile && course.createdBy.equals(profile._id));
}

interface Viewer {
  userId: string;
  role: string;
}

export async function listCourseSessions(
  courseId: string,
  viewer: Viewer
): Promise<CourseSessionDocument[]> {
  const course = await requireCourse(courseId);

  const allowed =
    isCourseTrainer(course, viewer.userId) ||
    (await isCourseAdminOwner(course, viewer.userId)) ||
    (await EnrollmentModel.exists({
      studentId: viewer.userId,
      courseId,
      status: { $in: ['active', 'completed'] },
    }));

  if (!allowed) {
    throw new ApiError(404, 'Course not found');
  }

  return CourseSessionModel.find({ courseId }).sort({ dayNumber: 1 });
}

export async function getRoster(
  courseId: string,
  trainerUserId: string
): Promise<{ studentId: string; email: string }[]> {
  const course = await requireCourse(courseId);
  if (!isCourseTrainer(course, trainerUserId)) {
    throw new ApiError(403, 'You do not have access to this course');
  }

  const enrollments = await EnrollmentModel.find({
    courseId,
    status: { $in: ['active', 'completed'] },
  });
  const students = await UserModel.find({ _id: { $in: enrollments.map((e) => e.studentId) } });

  return students.map((student) => ({ studentId: student._id.toString(), email: student.email }));
}

async function getOwnedSession(sessionId: string, trainerUserId: string) {
  const session = await CourseSessionModel.findById(sessionId);
  if (!session) {
    throw new ApiError(404, 'Session not found');
  }
  const course = await requireCourse(session.courseId.toString());
  if (!isCourseTrainer(course, trainerUserId)) {
    throw new ApiError(403, 'You do not have access to this session');
  }
  return { session, course };
}

const ALLOWED_SESSION_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

export async function updateSession(
  sessionId: string,
  trainerUserId: string,
  input: UpdateSessionInput
): Promise<CourseSessionDocument> {
  const { session } = await getOwnedSession(sessionId, trainerUserId);

  const allowed = ALLOWED_SESSION_TRANSITIONS[session.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw new ApiError(400, `Cannot move a session from "${session.status}" to "${input.status}"`);
  }

  session.status = input.status;
  session.cancelReason = input.status === 'cancelled' ? (input.cancelReason ?? null) : null;
  await session.save();
  return session;
}

// Submitting attendance also marks the session completed — in practice a
// Trainer takes attendance exactly when a class happens, so this is one
// action rather than two separate steps.
export async function markAttendance(
  sessionId: string,
  trainerUserId: string,
  input: MarkAttendanceInput
): Promise<CourseSessionDocument> {
  const { session, course } = await getOwnedSession(sessionId, trainerUserId);
  if (session.status === 'cancelled') {
    throw new ApiError(400, 'Cannot mark attendance for a cancelled session');
  }

  const enrolledStudentIds = new Set(
    (
      await EnrollmentModel.find({
        courseId: course._id,
        status: { $in: ['active', 'completed'] },
      })
    ).map((e) => e.studentId.toString())
  );

  const invalid = input.records.filter((r) => !enrolledStudentIds.has(r.studentId));
  if (invalid.length > 0) {
    throw new ApiError(
      400,
      `Not enrolled in this course: ${invalid.map((r) => r.studentId).join(', ')}`
    );
  }

  const markedAt = new Date();
  await Promise.all(
    input.records.map((record) =>
      AttendanceRecordModel.findOneAndUpdate(
        { sessionId: session._id, studentId: record.studentId },
        { status: record.status, markedAt, markedBy: trainerUserId },
        { upsert: true }
      )
    )
  );

  session.status = 'completed';
  session.cancelReason = null;
  await session.save();
  return session;
}

export interface AttendanceHistoryRow {
  session: CourseSessionDocument;
  status: 'present' | 'absent' | 'excused' | null;
  markedAt: Date | null;
}

export async function getStudentAttendance(
  studentId: string,
  courseId: string,
  viewer: Viewer
): Promise<AttendanceHistoryRow[]> {
  const course = await requireCourse(courseId);

  const allowed =
    viewer.userId === studentId ||
    isCourseTrainer(course, viewer.userId) ||
    (await isCourseAdminOwner(course, viewer.userId));

  if (!allowed) {
    throw new ApiError(403, 'You do not have access to this attendance history');
  }

  const sessions = await CourseSessionModel.find({ courseId }).sort({ dayNumber: 1 });
  const records = await AttendanceRecordModel.find({
    studentId,
    sessionId: { $in: sessions.map((s) => s._id) },
  });
  const recordBySession = new Map(records.map((r) => [r.sessionId.toString(), r]));

  return sessions.map((session) => {
    const record = recordBySession.get(session._id.toString());
    return {
      session,
      status: record?.status ?? null,
      markedAt: record?.markedAt ?? null,
    };
  });
}
