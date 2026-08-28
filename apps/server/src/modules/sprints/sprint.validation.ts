import { z } from 'zod';

export const replaceTasksSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().min(1),
      status: z.enum(['pending', 'in_progress', 'completed']),
      dueDate: z.string().min(1),
    })
  ),
});

export const submitMilestoneSchema = z.object({
  artifactUrls: z.array(z.string()).default([]),
  demoDate: z.string().optional(),
});

export const addFeedbackSchema = z.object({
  comment: z.string().min(1),
  rating: z.number().int().min(1).max(5).optional(),
});

export type ReplaceTasksInput = z.infer<typeof replaceTasksSchema>;
export type SubmitMilestoneInput = z.infer<typeof submitMilestoneSchema>;
export type AddFeedbackInput = z.infer<typeof addFeedbackSchema>;
