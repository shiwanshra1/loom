import { z } from 'zod';

export const upsertVideoProgressSchema = z.object({
  courseId: z.string().min(1),
  dayNumber: z.number().int().positive(),
  positionSeconds: z.number().min(0),
  durationSeconds: z.number().min(0),
});

export type UpsertVideoProgressInput = z.infer<typeof upsertVideoProgressSchema>;
