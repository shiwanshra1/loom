import { CourseSessionModel } from '../../models/CourseSession.js';
import { AttendanceRecordModel } from '../../models/AttendanceRecord.js';
import { VideoProgressModel } from '../../models/VideoProgress.js';
import { AssessmentModel, type AssessmentDocument } from '../../models/Assessment.js';
import { ApiError } from '../../utils/ApiError.js';
import { isCourseAdminOwner, isCourseTrainer, requireCourse } from '../courses/courseAccess.js';

interface Viewer {
  userId: string;
  role: string;
}

export interface CourseProgressResult {
  courseId: string;
  overallPercent: number;
  modulesCompleted: number;
  modulesTotal: number;
  nextSession: { dayNumber: number; scheduledDate: Date } | null;
  nextAssessment: AssessmentDocument | null;
}

// The single computed rollup a KPI view needs — everything here is
// recomputed live on each read rather than cached, which is fine at
// per-student, per-course query volume (same call the architecture doc
// makes for builderScore-scale rollups, revisit only if this becomes a
// bottleneck).
export async function getStudentCourseProgress(
  studentId: string,
  courseId: string,
  viewer: Viewer
): Promise<CourseProgressResult> {
  const course = await requireCourse(courseId);

  const allowed =
    viewer.userId === studentId ||
    isCourseTrainer(course, viewer.userId) ||
    (await isCourseAdminOwner(course, viewer.userId));
  if (!allowed) {
    throw new ApiError(403, 'You do not have access to this progress data');
  }

  const modulesTotal = course.syllabus.length;
  let modulesCompleted = 0;
  let nextSession: { dayNumber: number; scheduledDate: Date } | null = null;

  if (course.deliveryMode === 'offline') {
    const sessions = await CourseSessionModel.find({ courseId });
    const records = await AttendanceRecordModel.find({
      studentId,
      sessionId: { $in: sessions.map((s) => s._id) },
    });
    const creditedSessionIds = new Set(
      records
        .filter((r) => r.status === 'present' || r.status === 'excused')
        .map((r) => r.sessionId.toString())
    );
    modulesCompleted = sessions.filter((s) => creditedSessionIds.has(s._id.toString())).length;

    const upcoming = sessions
      .filter((s) => s.status === 'scheduled')
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())[0];
    if (upcoming) {
      nextSession = { dayNumber: upcoming.dayNumber, scheduledDate: upcoming.scheduledDate };
    }
  } else {
    const progress = await VideoProgressModel.find({ studentId, courseId });
    modulesCompleted = progress.filter((p) => p.completed).length;
  }

  const nextAssessment =
    (
      await AssessmentModel.find({ courseId, scheduledDate: { $gte: new Date() } }).sort({
        scheduledDate: 1,
      })
    )[0] ?? null;

  return {
    courseId,
    overallPercent: modulesTotal > 0 ? Math.round((modulesCompleted / modulesTotal) * 100) : 0,
    modulesCompleted,
    modulesTotal,
    nextSession,
    nextAssessment,
  };
}
