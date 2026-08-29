import { z } from 'zod';

export const createBookingSchema = z.object({
  counterpartEmail: z.string().email(),
  title: z.string().min(1),
  scheduledAt: z.string().min(1),
  durationMinutes: z.number().int().min(5).optional(),
  agenda: z.array(z.string()).optional(),
});

export const updateBookingSchema = z.object({
  status: z.enum(['completed', 'cancelled']).optional(),
  note: z.string().optional(),
  meetingLink: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
