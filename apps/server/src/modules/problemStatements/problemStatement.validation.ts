import { z } from 'zod';

export const createProblemStatementSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  overview: z.string().optional(),
  source: z.enum(['industry', 'government', 'internal']),
  domain: z.string().min(1),
  tags: z.array(z.string()).optional(),
  teamSize: z.number().int().min(1),
  durationWeeks: z.number().int().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  featured: z.boolean().optional(),
  deliverables: z
    .array(z.object({ title: z.string().min(1), done: z.boolean().optional() }))
    .optional(),
});

export type CreateProblemStatementInput = z.infer<typeof createProblemStatementSchema>;
