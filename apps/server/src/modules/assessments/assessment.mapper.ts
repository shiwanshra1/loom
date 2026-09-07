import type { AssessmentDto } from '@forge-loom/shared-types';
import type { Assessment } from '@prisma/client';

export function toAssessmentDto(assessment: Assessment): AssessmentDto {
  return {
    id: assessment.id,
    courseId: assessment.courseId,
    title: assessment.title,
    type: assessment.type,
    scheduledDate: assessment.scheduledDate.toISOString(),
  };
}
