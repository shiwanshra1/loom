import type { Cohort } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import type { CreateCohortInput, UpdateCohortPhaseInput } from './cohort.validation.js';

type CohortPhase = 'activation' | 'bootcamp' | 'citadel';

// activation -> bootcamp -> citadel only, same forward-only convention as
// course status transitions — no stated use case for moving backwards.
const ALLOWED_PHASE_TRANSITIONS: Record<CohortPhase, CohortPhase[]> = {
  activation: ['bootcamp'],
  bootcamp: ['citadel'],
  citadel: [],
};

// collegeId is resolved by the caller (Forge Admin supplies it explicitly;
// College Admin gets it forced from their own session) rather than trusted
// from CreateCohortInput directly.
export async function createCohort(collegeId: string, input: CreateCohortInput): Promise<Cohort> {
  return prisma.cohort.create({
    data: {
      collegeId,
      name: input.name,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    },
  });
}

export interface CohortListFilter {
  collegeId?: string;
}

export async function listCohorts(filter: CohortListFilter): Promise<Cohort[]> {
  return prisma.cohort.findMany({
    where: { ...(filter.collegeId && { collegeId: filter.collegeId }) },
    orderBy: { startDate: 'desc' },
  });
}

export async function advanceCohortPhase(
  cohortId: string,
  input: UpdateCohortPhaseInput
): Promise<Cohort> {
  const cohort = await prisma.cohort.findUnique({ where: { id: cohortId } });
  if (!cohort) {
    throw new ApiError(404, 'Cohort not found');
  }

  const allowed = ALLOWED_PHASE_TRANSITIONS[cohort.phase as CohortPhase];
  if (!allowed.includes(input.phase)) {
    throw new ApiError(400, `Cannot move a cohort from "${cohort.phase}" to "${input.phase}"`);
  }

  return prisma.cohort.update({ where: { id: cohortId }, data: { phase: input.phase } });
}
