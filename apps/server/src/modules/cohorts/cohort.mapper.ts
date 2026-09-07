import type { CohortDto } from '@forge-loom/shared-types';
import type { Cohort } from '@prisma/client';

export function toCohortDto(cohort: Cohort): CohortDto {
  return {
    id: cohort.id,
    collegeId: cohort.collegeId,
    name: cohort.name,
    startDate: cohort.startDate.toISOString(),
    endDate: cohort.endDate.toISOString(),
    phase: cohort.phase,
  };
}
