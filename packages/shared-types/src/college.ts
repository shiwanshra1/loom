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
