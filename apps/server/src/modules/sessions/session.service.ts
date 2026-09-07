import type { AttendanceRecord, CourseSession } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { createNotification } from '../notifications/notification.service.js';
import {
  canViewCourse,
  isCourseAdminOwner,
  isCourseTrainer,
  requireCourse,
  type CourseWithSyllabus,
} from '../courses/courseAccess.js';
import type { MarkAttendanceInput, UpdateSessionInput } from './session.validation.js';

// Sessions only materialize for offline courses — online courses are tracked
// via Phase 4's per-video watch progress instead of attendance. Called once,
// idempotently, the first time a course gets its first active enrollment;
// since there's no cohort/batch concept yet (that's Phase 6), this treats the
// whole course as a single implicit cohort starting "today."
export async function ensureSessionsForCourse(course: CourseWithSyllabus): Promise<void> {
  if (course.deliveryMode !== 'offline') {
    return;
  }

  const existing = await prisma.courseSession.count({ where: { courseId: course.id } });
  if (existing > 0) {
    return;
  }

  const baseDate = new Date();
  const sessions = course.syllabus.map((day) => {
    const scheduledDate = new Date(baseDate);
    scheduledDate.setDate(scheduledDate.getDate() + (day.dayNumber - 1));
    return {
      courseId: course.id,
      dayNumber: day.dayNumber,
      scheduledDate,
      mode: 'offline' as const,
      status: 'scheduled' as const,
      cancelReason: null,
      trainerId: course.trainerId,
    };
  });

  if (sessions.length > 0) {
    await prisma.courseSession.createMany({ data: sessions });
  }
}

interface Viewer {
  userId: string;
  role: string;
}

export async function listCourseSessions(
  courseId: string,
  viewer: Viewer
): Promise<CourseSession[]> {
  const course = await requireCourse(courseId);

  if (!(await canViewCourse(course, viewer))) {
    throw new ApiError(404, 'Course not found');
  }

  return prisma.courseSession.findMany({ where: { courseId }, orderBy: { dayNumber: 'asc' } });
}

export interface RosterEntry {
  studentId: string;
  email: string;
  enrollmentId: string;
  enrollmentStatus: string;
}

export async function getRoster(courseId: string, trainerUserId: string): Promise<RosterEntry[]> {
  const course = await requireCourse(courseId);
  if (!isCourseTrainer(course, trainerUserId)) {
    throw new ApiError(403, 'You do not have access to this course');
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId, status: { in: ['active', 'completed'] } },
  });
  const students = await prisma.user.findMany({
    where: { id: { in: enrollments.map((e) => e.studentId) } },
  });
  const emailByStudentId = new Map(students.map((s) => [s.id, s.email]));

  return enrollments.map((enrollment) => ({
    studentId: enrollment.studentId,
    email: emailByStudentId.get(enrollment.studentId) ?? '',
    enrollmentId: enrollment.id,
    enrollmentStatus: enrollment.status,
  }));
}

async function getOwnedSession(sessionId: string, trainerUserId: string) {
  const session = await prisma.courseSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    throw new ApiError(404, 'Session not found');
  }
  const course = await requireCourse(session.courseId);
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
): Promise<CourseSession> {
  const { session } = await getOwnedSession(sessionId, trainerUserId);

  const allowed = ALLOWED_SESSION_TRANSITIONS[session.status] ?? [];
  if (!allowed.includes(input.status)) {
    throw new ApiError(400, `Cannot move a session from "${session.status}" to "${input.status}"`);
  }

  const cancelReason = input.status === 'cancelled' ? (input.cancelReason ?? null) : null;
  const updated = await prisma.courseSession.update({
    where: { id: sessionId },
    data: { status: input.status, cancelReason },
  });

  if (input.status === 'cancelled') {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: session.courseId, status: { in: ['active', 'completed'] } },
    });
    await Promise.all(
      enrollments.map((enrollment) =>
        createNotification(
          enrollment.studentId,
          'session_cancelled',
          `Day ${session.dayNumber} session cancelled`,
          cancelReason ?? undefined
        )
      )
    );
  }

  return updated;
}

// Submitting attendance also marks the session completed — in practice a
// Trainer takes attendance exactly when a class happens, so this is one
// action rather than two separate steps.
export async function markAttendance(
  sessionId: string,
  trainerUserId: string,
  input: MarkAttendanceInput
): Promise<CourseSession> {
  const { session, course } = await getOwnedSession(sessionId, trainerUserId);
  if (session.status === 'cancelled') {
    throw new ApiError(400, 'Cannot mark attendance for a cancelled session');
  }

  const enrolledStudentIds = new Set(
    (
      await prisma.enrollment.findMany({
        where: { courseId: course.id, status: { in: ['active', 'completed'] } },
      })
    ).map((e) => e.studentId)
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
      prisma.attendanceRecord.upsert({
        where: { sessionId_studentId: { sessionId: session.id, studentId: record.studentId } },
        update: { status: record.status, markedAt, markedBy: trainerUserId },
        create: {
          sessionId: session.id,
          studentId: record.studentId,
          status: record.status,
          markedAt,
          markedBy: trainerUserId,
        },
      })
    )
  );

  return prisma.courseSession.update({
    where: { id: sessionId },
    data: { status: 'completed', cancelReason: null },
  });
}

export interface AttendanceHistoryRow {
  session: CourseSession;
  status: AttendanceRecord['status'] | null;
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

  const sessions = await prisma.courseSession.findMany({
    where: { courseId },
    orderBy: { dayNumber: 'asc' },
  });
  const records = await prisma.attendanceRecord.findMany({
    where: { studentId, sessionId: { in: sessions.map((s) => s.id) } },
  });
  const recordBySession = new Map(records.map((r) => [r.sessionId, r]));

  return sessions.map((session) => {
    const record = recordBySession.get(session.id);
    return {
      session,
      status: record?.status ?? null,
      markedAt: record?.markedAt ?? null,
    };
  });
}
