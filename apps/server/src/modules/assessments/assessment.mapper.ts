import type { AssessmentDto } from '@forge-loom/shared-types';
import type { AssessmentDocument } from '../../models/Assessment.js';

export function toAssessmentDto(assessment: AssessmentDocument): AssessmentDto {
  return {
    id: assessment._id.toString(),
    courseId: assessment.courseId.toString(),
    title: assessment.title,
    type: assessment.type,
    scheduledDate: assessment.scheduledDate.toISOString(),
  };
}
