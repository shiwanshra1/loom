export type ProblemStatementSource = 'industry' | 'government' | 'internal';
export type ProblemStatementDifficulty = 'easy' | 'medium' | 'hard';
export type ProblemStatementStatus = 'open' | 'closed';

export interface ProblemStatementDeliverableDto {
  title: string;
  done: boolean;
}

export interface ProblemStatementDto {
  id: string;
  title: string;
  description: string;
  overview?: string;
  source: ProblemStatementSource;
  domain: string;
  tags: string[];
  teamSize: number;
  durationWeeks: number;
  difficulty: ProblemStatementDifficulty;
  status: ProblemStatementStatus;
  featured: boolean;
  deliverables: ProblemStatementDeliverableDto[];
  // Viewer-scoped, computed per request rather than stored on the document.
  bookmarked: boolean;
  isMine: boolean;
  interested: boolean;
  updatedAt: string;
}
