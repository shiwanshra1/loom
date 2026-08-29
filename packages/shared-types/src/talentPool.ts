// Deliberately close to StudentProfile's real fields — no bio/projects/
// execution-history data exists yet (that would need a portfolio collection
// this roadmap never introduces), so the "Full Builder Profile" drill-in the
// wireframe describes is scoped down to what's actually stored today.
export interface TalentProfileDto {
  studentId: string;
  name: string;
  domain?: string;
  skills: string[];
  score: number;
  collegeName?: string;
  course?: string;
  linkedIn?: string;
}

export interface TalentSearchPageDto {
  results: TalentProfileDto[];
  nextCursor: string | null;
}
