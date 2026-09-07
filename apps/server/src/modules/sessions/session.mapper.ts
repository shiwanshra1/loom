import type { AttendanceHistoryEntryDto, CourseSessionDto } from '@forge-loom/shared-types';
import type { CourseSession } from '@prisma/client';
import type { AttendanceHistoryRow } from './session.service.js';

export function toSessionDto(session: CourseSession): CourseSessionDto {
  return {
    id: session.id,
    courseId: session.courseId,
    dayNumber: session.dayNumber,
    scheduledDate: session.scheduledDate.toISOString(),
    mode: session.mode,
    status: session.status,
    cancelReason: session.cancelReason,
    trainerId: session.trainerId,
  };
}

export function toAttendanceHistoryEntryDto(row: AttendanceHistoryRow): AttendanceHistoryEntryDto {
  return {
    session: toSessionDto(row.session),
    status: row.status,
    markedAt: row.markedAt ? row.markedAt.toISOString() : null,
  };
}
