import type { HrCompanyProfileDto } from '@forge-loom/shared-types';
import type { HrProfile } from '@prisma/client';

export function toHrCompanyProfileDto(profile: HrProfile): HrCompanyProfileDto {
  return {
    companyName: profile.companyName,
    industry: profile.industry ?? undefined,
    description: profile.companyDetails ?? undefined,
  };
}
