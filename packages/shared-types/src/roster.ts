import type { Role } from './role.js';

export interface RosterStudentDto {
  userId: string;
  email: string;
  name: string;
  rollNumber: string | null;
  cohortId: string | null;
  cohortName: string | null;
}

export interface CreateRosterMemberResultDto {
  user: {
    id: string;
    email: string;
    role: Role;
  };
  // Shown once, immediately — see OnboardCollegeResultDto's note in college.ts.
  tempPassword: string;
}
