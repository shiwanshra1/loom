import type { CohortDto } from '@forge-loom/shared-types';
import type { CohortDocument } from '../../models/Cohort.js';

export function toCohortDto(cohort: CohortDocument): CohortDto {
  return {
    id: cohort._id.toString(),
    collegeId: cohort.collegeId.toString(),
    name: cohort.name,
    startDate: cohort.startDate.toISOString(),
    endDate: cohort.endDate.toISOString(),
    phase: cohort.phase,
  };
}
