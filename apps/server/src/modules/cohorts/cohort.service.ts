import { CohortModel, type CohortDocument, type CohortPhase } from '../../models/Cohort.js';
import { ApiError } from '../../utils/ApiError.js';
import type { CreateCohortInput, UpdateCohortPhaseInput } from './cohort.validation.js';

// activation -> bootcamp -> citadel only, same forward-only convention as
// course status transitions — no stated use case for moving backwards.
const ALLOWED_PHASE_TRANSITIONS: Record<CohortPhase, CohortPhase[]> = {
  activation: ['bootcamp'],
  bootcamp: ['citadel'],
  citadel: [],
};

export async function createCohort(input: CreateCohortInput): Promise<CohortDocument> {
  return CohortModel.create({
    collegeId: input.collegeId,
    name: input.name,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
  });
}

export async function listCohorts(filter: Record<string, unknown>): Promise<CohortDocument[]> {
  return CohortModel.find(filter).sort({ startDate: -1 });
}

export async function advanceCohortPhase(
  cohortId: string,
  input: UpdateCohortPhaseInput
): Promise<CohortDocument> {
  const cohort = await CohortModel.findById(cohortId);
  if (!cohort) {
    throw new ApiError(404, 'Cohort not found');
  }

  const allowed = ALLOWED_PHASE_TRANSITIONS[cohort.phase];
  if (!allowed.includes(input.phase)) {
    throw new ApiError(400, `Cannot move a cohort from "${cohort.phase}" to "${input.phase}"`);
  }

  cohort.phase = input.phase;
  await cohort.save();
  return cohort;
}
