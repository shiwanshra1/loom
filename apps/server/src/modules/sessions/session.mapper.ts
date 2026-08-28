import type { AttendanceHistoryEntryDto, CourseSessionDto } from '@forge-loom/shared-types';
import type { CourseSessionDocument } from '../../models/CourseSession.js';
import type { AttendanceHistoryRow } from './session.service.js';

export function toSessionDto(session: CourseSessionDocument): CourseSessionDto {
  return {
    id: session._id.toString(),
    courseId: session.courseId.toString(),
    dayNumber: session.dayNumber,
    scheduledDate: session.scheduledDate.toISOString(),
    mode: session.mode,
    status: session.status,
    cancelReason: session.cancelReason,
    trainerId: session.trainerId ? session.trainerId.toString() : null,
  };
}

export function toAttendanceHistoryEntryDto(row: AttendanceHistoryRow): AttendanceHistoryEntryDto {
  return {
    session: toSessionDto(row.session),
    status: row.status,
    markedAt: row.markedAt ? row.markedAt.toISOString() : null,
  };
}
