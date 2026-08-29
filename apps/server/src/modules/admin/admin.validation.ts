import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended']),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
