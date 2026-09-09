import { z } from 'zod';
import { Role, SELF_REGISTERABLE_ROLES } from '@forge-loom/shared-types';

// collegeId is no longer accepted here — none of the remaining
// self-registerable roles are college-scoped (Forge Admin hierarchy Phase 5).
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'displayName is required'),
  role: z.enum(SELF_REGISTERABLE_ROLES as [Role, ...Role[]]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
