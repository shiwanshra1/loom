import type { CohortPhase } from './cohort.js';

// No enum values were specified in the architecture doc for partnerTier —
// this three-tier scheme is a disclosed invention, not a spec'd contract.
export type CollegePartnerTier = 'bronze' | 'silver' | 'gold';

export interface CollegeDto {
  id: string;
  name: string;
  location?: string;
  partnerTier: CollegePartnerTier;
  createdAt: string;
}

export interface CollegeProgramDto {
  courseId: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  studentsEnrolled: number;
}

export interface CollegeFacultyMemberDto {
  userId: string;
  email: string;
  role: 'mentor' | 'trainer';
  workload: number;
}

export interface PartnerCollegeDto {
  id: string;
  name: string;
  studentCount: number;
  activePhase: CohortPhase | null;
  contactEmail: string | null;
}

export interface OnboardCollegeResultDto {
  college: CollegeDto;
  collegeAdmin: {
    id: string;
    email: string;
  };
  // Shown once, immediately, as a manual fallback in case the queued welcome
  // email hasn't landed yet — never persisted or re-fetchable after this
  // response (see the open risk noted in the ticket doc).
  tempPassword: string;
}

export interface AdminCollegeSummaryDto {
  id: string;
  name: string;
  location?: string;
  partnerTier: CollegePartnerTier;
  adminEmail: string | null;
  studentCount: number;
  batchCount: number;
  createdAt: string;
}
