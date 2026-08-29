import { z } from 'zod';

export const updateHrProfileSchema = z.object({
  companyName: z.string().min(1).optional(),
  industry: z.string().optional(),
  companyDetails: z.string().optional(),
});

export type UpdateHrProfileInput = z.infer<typeof updateHrProfileSchema>;
