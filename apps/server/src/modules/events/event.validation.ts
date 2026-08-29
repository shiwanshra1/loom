import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['hackathon', 'seminar', 'workshop', 'other']),
  venue: z.string().optional(),
  scheduledAt: z.string().min(1),
  agenda: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
