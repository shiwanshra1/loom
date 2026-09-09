import { z } from 'zod';

// collegeId is optional here because a College Admin caller never supplies
// it — the controller forces it from their own session instead. Forge Admin
// still must supply it explicitly (there's no "own college" to default to).
export const createCohortSchema = z.object({
  collegeId: z.string().min(1).optional(),
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export const updateCohortPhaseSchema = z.object({
  phase: z.enum(['activation', 'bootcamp', 'citadel']),
});

export type CreateCohortInput = z.infer<typeof createCohortSchema>;
export type UpdateCohortPhaseInput = z.infer<typeof updateCohortPhaseSchema>;
