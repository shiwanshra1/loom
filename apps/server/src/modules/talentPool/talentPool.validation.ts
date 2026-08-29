import { z } from 'zod';

export const searchTalentPoolSchema = z.object({
  domain: z.string().optional(),
  query: z.string().optional(),
  minScore: z.coerce.number().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
});

export type SearchTalentPoolInput = z.infer<typeof searchTalentPoolSchema>;
