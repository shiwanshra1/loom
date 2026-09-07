import type { CollegeDto, PartnerCollegeDto } from '@forge-loom/shared-types';
import type { College } from '@prisma/client';
import type { PartnerCollegeRow } from './college.service.js';

export function toCollegeDto(college: College): CollegeDto {
  return {
    id: college.id,
    name: college.name,
    location: college.location ?? undefined,
    partnerTier: college.partnerTier,
    createdAt: college.createdAt.toISOString(),
  };
}

export function toPartnerCollegeDto(row: PartnerCollegeRow): PartnerCollegeDto {
  return {
    id: row.college.id,
    name: row.college.name,
    studentCount: row.studentCount,
    activePhase: row.activePhase,
    contactEmail: row.contactEmail,
  };
}
