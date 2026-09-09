import { z } from 'zod';

// Onboarding a college now creates its College Admin account in the same
// call (Forge Admin hierarchy Phase 4) — there's no longer a "create a bare
// College with no admin" path, since every college on the platform is
// onboarded top-down by a Forge Admin from here on.
export const onboardCollegeSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  partnerTier: z.enum(['bronze', 'silver', 'gold']).optional(),
  adminEmail: z.string().email(),
  adminDisplayName: z.string().min(1),
});

export type OnboardCollegeInput = z.infer<typeof onboardCollegeSchema>;
