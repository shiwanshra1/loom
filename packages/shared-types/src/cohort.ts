export type CohortPhase = 'activation' | 'bootcamp' | 'citadel';

export interface CohortDto {
  id: string;
  collegeId: string;
  name: string;
  startDate: string;
  endDate: string;
  phase: CohortPhase;
}
