import { z } from 'zod';

export const createCohortSchema = z.object({
  collegeId: z.string().min(1),
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export const updateCohortPhaseSchema = z.object({
  phase: z.enum(['activation', 'bootcamp', 'citadel']),
});

export type CreateCohortInput = z.infer<typeof createCohortSchema>;
export type UpdateCohortPhaseInput = z.infer<typeof updateCohortPhaseSchema>;
