import { z } from 'zod';
import { Role, SELF_REGISTERABLE_ROLES } from '@forge-loom/shared-types';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'displayName is required'),
  role: z.enum(SELF_REGISTERABLE_ROLES as [Role, ...Role[]]),
  collegeId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
