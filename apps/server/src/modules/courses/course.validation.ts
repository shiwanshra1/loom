import { z } from 'zod';

export const syllabusDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().optional(),
});

export const createCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  deliveryMode: z.enum(['online', 'offline']),
  durationHours: z.number().min(0),
  durationDays: z.number().min(0),
  price: z.number().min(0),
  currency: z.string().min(1).optional(),
  syllabus: z.array(syllabusDaySchema).optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const updateCourseStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']),
});

export const listCoursesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  cursor: z.string().optional(),
  deliveryMode: z.enum(['online', 'offline']).optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type UpdateCourseStatusInput = z.infer<typeof updateCourseStatusSchema>;
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
