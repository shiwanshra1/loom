import type { CourseProgressDto } from '@forge-loom/shared-types';
import type { CourseProgressResult } from './courseProgress.service.js';

export function toCourseProgressDto(result: CourseProgressResult): CourseProgressDto {
  return {
    courseId: result.courseId,
    overallPercent: result.overallPercent,
    modulesCompleted: result.modulesCompleted,
    modulesTotal: result.modulesTotal,
    nextSession: result.nextSession
      ? {
          dayNumber: result.nextSession.dayNumber,
          scheduledDate: result.nextSession.scheduledDate.toISOString(),
        }
      : null,
    nextAssessment: result.nextAssessment
      ? {
          title: result.nextAssessment.title,
          type: result.nextAssessment.type,
          scheduledDate: result.nextAssessment.scheduledDate.toISOString(),
        }
      : null,
  };
}
