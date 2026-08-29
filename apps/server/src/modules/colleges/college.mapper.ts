import type { CollegeDto, PartnerCollegeDto } from '@forge-loom/shared-types';
import type { CollegeDocument } from '../../models/College.js';
import type { PartnerCollegeRow } from './college.service.js';

export function toCollegeDto(college: CollegeDocument): CollegeDto {
  return {
    id: college._id.toString(),
    name: college.name,
    location: college.location,
    partnerTier: college.partnerTier,
    createdAt: college.createdAt.toISOString(),
  };
}

export function toPartnerCollegeDto(row: PartnerCollegeRow): PartnerCollegeDto {
  return {
    id: row.college._id.toString(),
    name: row.college.name,
    studentCount: row.studentCount,
    activePhase: row.activePhase,
    contactEmail: row.contactEmail,
  };
}
