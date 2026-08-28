import type { AssessmentType } from './assessment.js';

export interface CourseProgressDto {
  courseId: string;
  overallPercent: number;
  modulesCompleted: number;
  modulesTotal: number;
  nextSession: { dayNumber: number; scheduledDate: string } | null;
  nextAssessment: { title: string; type: AssessmentType; scheduledDate: string } | null;
}
