import type { ProblemStatementDto } from '@forge-loom/shared-types';
import type { ProblemStatementRow } from './problemStatement.service.js';

export function toProblemStatementDto(row: ProblemStatementRow): ProblemStatementDto {
  const { problemStatement } = row;
  return {
    id: problemStatement._id.toString(),
    title: problemStatement.title,
    description: problemStatement.description,
    overview: problemStatement.overview,
    source: problemStatement.source,
    domain: problemStatement.domain,
    tags: problemStatement.tags,
    teamSize: problemStatement.teamSize,
    durationWeeks: problemStatement.durationWeeks,
    difficulty: problemStatement.difficulty,
    status: problemStatement.status,
    featured: problemStatement.featured,
    deliverables: problemStatement.deliverables,
    bookmarked: row.bookmarked,
    isMine: row.isMine,
    interested: row.interested,
    updatedAt: problemStatement.updatedAt.toISOString(),
  };
}
