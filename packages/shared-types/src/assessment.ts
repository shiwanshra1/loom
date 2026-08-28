export type AssessmentType = 'quiz' | 'exam' | 'assignment';

export interface AssessmentDto {
  id: string;
  courseId: string;
  title: string;
  type: AssessmentType;
  scheduledDate: string;
}
