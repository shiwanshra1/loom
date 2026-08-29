import { z } from 'zod';

export const createSpeakerTopicSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export type CreateSpeakerTopicInput = z.infer<typeof createSpeakerTopicSchema>;
