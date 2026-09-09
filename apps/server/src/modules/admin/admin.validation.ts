import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended']),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

export const createForgeAdminSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
});

export type CreateForgeAdminInput = z.infer<typeof createForgeAdminSchema>;
