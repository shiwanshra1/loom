import type { CollegeDto } from '@forge-loom/shared-types';
import type { CollegeDocument } from '../../models/College.js';

export function toCollegeDto(college: CollegeDocument): CollegeDto {
  return {
    id: college._id.toString(),
    name: college.name,
    location: college.location,
    partnerTier: college.partnerTier,
    createdAt: college.createdAt.toISOString(),
  };
}
