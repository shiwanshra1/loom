export interface TeamMemberDto {
  studentId: string;
  name: string;
}

export interface TeamDto {
  id: string;
  name: string;
  collegeId: string;
  members: TeamMemberDto[];
  mentorId: string | null;
  trainerId: string | null;
  // Populated starting Phase 7 (Citadel) — always null until then.
  problemStatementId: string | null;
}
