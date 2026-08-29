import type { HrCompanyProfileDto } from '@forge-loom/shared-types';
import type { HrProfileDocument } from '../../models/HrProfile.js';

export function toHrCompanyProfileDto(profile: HrProfileDocument): HrCompanyProfileDto {
  return {
    companyName: profile.companyName,
    industry: profile.industry,
    description: profile.companyDetails,
  };
}
