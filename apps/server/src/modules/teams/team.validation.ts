import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(1),
  memberStudentIds: z.array(z.string()).optional(),
  mentorEmail: z.string().email().optional(),
  trainerEmail: z.string().email().optional(),
  problemStatementId: z.string().optional(),
});

export const updateTeamSchema = createTeamSchema.partial();

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
