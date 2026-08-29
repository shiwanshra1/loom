import { z } from 'zod';

export const inviteCommunityMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['lead', 'volunteer', 'public']).optional(),
});

export type InviteCommunityMemberInput = z.infer<typeof inviteCommunityMemberSchema>;
