import { z } from 'zod';

export const createCollegeSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  partnerTier: z.enum(['bronze', 'silver', 'gold']).optional(),
});

export type CreateCollegeInput = z.infer<typeof createCollegeSchema>;
