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

const bulkStudentRowSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  rollNumber: z.string().min(1).optional(),
  cohortId: z.string().min(1).optional(),
});

// Capped at 1000 rows — generous over the plan's "100-500 row batch"
// load-test target, while still bounding request size against abuse.
export const bulkCreateStudentsSchema = z.object({
  rows: z.array(bulkStudentRowSchema).min(1).max(1000),
});

export type BulkCreateStudentsInput = z.infer<typeof bulkCreateStudentsSchema>;

const sendWelcomeEmailsAccountSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  tempPassword: z.string().min(1),
});

export const sendWelcomeEmailsSchema = z.object({
  accounts: z.array(sendWelcomeEmailsAccountSchema).min(1).max(1000),
});

export type SendWelcomeEmailsInput = z.infer<typeof sendWelcomeEmailsSchema>;
