import { z } from 'zod';

export const createEnrollmentSchema = z.object({
  courseId: z.string().min(1),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;
