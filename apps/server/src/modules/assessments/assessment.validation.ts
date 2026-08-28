import { z } from 'zod';

export const createAssessmentSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['quiz', 'exam', 'assignment']),
  scheduledDate: z.string().min(1),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
