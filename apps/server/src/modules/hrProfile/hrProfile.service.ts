import type { HrProfile } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import type { UpdateHrProfileInput } from './hrProfile.validation.js';

export async function getMyProfile(userId: string): Promise<HrProfile> {
  const profile = await prisma.hrProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new ApiError(404, 'HR profile not found');
  }
  return profile;
}

export async function updateMyProfile(
  userId: string,
  input: UpdateHrProfileInput
): Promise<HrProfile> {
  await getMyProfile(userId);
  return prisma.hrProfile.update({
    where: { userId },
    data: {
      ...(input.companyName !== undefined && { companyName: input.companyName }),
      ...(input.industry !== undefined && { industry: input.industry }),
      ...(input.companyDetails !== undefined && { companyDetails: input.companyDetails }),
    },
  });
}

export interface HrDirectoryEntry {
  companyName: string;
  contactEmail: string;
}

export async function listDirectory(): Promise<HrDirectoryEntry[]> {
  const profiles = await prisma.hrProfile.findMany();
  const users = await prisma.user.findMany({
    where: { id: { in: profiles.map((p) => p.userId) } },
  });
  const emailByUserId = new Map(users.map((u) => [u.id, u.email]));

  return profiles.map((profile) => ({
    companyName: profile.companyName,
    contactEmail: emailByUserId.get(profile.userId) ?? '',
  }));
}
