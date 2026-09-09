import type {
  AdminCollegeSummaryDto,
  CollegeDto,
  OnboardCollegeResultDto,
  PartnerCollegeDto,
} from '@forge-loom/shared-types';
import type { College } from '@prisma/client';
import type { AdminCollegeSummaryRow, OnboardCollegeResult, PartnerCollegeRow } from './college.service.js';

export function toCollegeDto(college: College): CollegeDto {
  return {
    id: college.id,
    name: college.name,
    location: college.location ?? undefined,
    partnerTier: college.partnerTier,
    createdAt: college.createdAt.toISOString(),
  };
}

export function toOnboardCollegeResultDto(result: OnboardCollegeResult): OnboardCollegeResultDto {
  return {
    college: toCollegeDto(result.college),
    collegeAdmin: { id: result.collegeAdmin.id, email: result.collegeAdmin.email },
    tempPassword: result.tempPassword,
  };
}

export function toAdminCollegeSummaryDto(row: AdminCollegeSummaryRow): AdminCollegeSummaryDto {
  return {
    id: row.college.id,
    name: row.college.name,
    location: row.college.location ?? undefined,
    partnerTier: row.college.partnerTier,
    adminEmail: row.adminEmail,
    studentCount: row.studentCount,
    batchCount: row.batchCount,
    createdAt: row.college.createdAt.toISOString(),
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
