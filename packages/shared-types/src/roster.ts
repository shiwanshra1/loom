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

export interface BulkStudentRowInput {
  name: string;
  email: string;
  rollNumber?: string;
  cohortId?: string;
}

export interface BulkCreateStudentResultRowDto {
  index: number;
  email: string;
  status: 'created' | 'error';
  error?: string;
  userId?: string;
  displayName?: string;
  // Shown once, immediately, same as CreateRosterMemberResultDto — never
  // persisted or re-fetchable, which is exactly why the explicit
  // send-welcome-emails step below needs the caller to hand it straight
  // back rather than looking it up server-side.
  tempPassword?: string;
}

export interface BulkCreateStudentsResultDto {
  results: BulkCreateStudentResultRowDto[];
  createdCount: number;
  errorCount: number;
}

export interface SendWelcomeEmailsAccountInput {
  userId: string;
  email: string;
  displayName: string;
  tempPassword: string;
}

export interface SendWelcomeEmailsResultDto {
  sent: number;
  skipped: number;
}
