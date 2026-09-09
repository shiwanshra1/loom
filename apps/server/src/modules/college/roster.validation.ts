import { z } from 'zod';

export const createRosterMemberSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
});

export type CreateRosterMemberInput = z.infer<typeof createRosterMemberSchema>;

// null explicitly un-batches a student (distinct from omitting the field).
export const updateStudentBatchSchema = z.object({
  cohortId: z.string().min(1).nullable(),
});

export type UpdateStudentBatchInput = z.infer<typeof updateStudentBatchSchema>;
