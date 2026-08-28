// courseSessions only materialize for offline courses in this phase — online
// courses rely on Phase 4's per-video watch progress instead of attendance.
// 'live_online' is kept in the type for Phase 5's unified calendar, but
// nothing creates a session in that mode yet.
export type CourseSessionMode = 'offline' | 'live_online' | 'self_paced';
export type CourseSessionStatus = 'scheduled' | 'completed' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'excused';

export interface CourseSessionDto {
  id: string;
  courseId: string;
  dayNumber: number;
  scheduledDate: string;
  mode: CourseSessionMode;
  status: CourseSessionStatus;
  cancelReason: string | null;
  trainerId: string | null;
}

export interface RosterEntryDto {
  studentId: string;
  email: string;
}

export interface AttendanceHistoryEntryDto {
  session: CourseSessionDto;
  status: AttendanceStatus | null; // null when the session hasn't had attendance marked (or was cancelled)
  markedAt: string | null;
}
