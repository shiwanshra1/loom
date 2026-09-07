import type { ProblemStatementDto } from '@forge-loom/shared-types';
import type { ProblemStatementRow } from './problemStatement.service.js';

export function toProblemStatementDto(row: ProblemStatementRow): ProblemStatementDto {
  const { problemStatement } = row;
  return {
    id: problemStatement.id,
    title: problemStatement.title,
    description: problemStatement.description,
    overview: problemStatement.overview ?? undefined,
    source: problemStatement.source,
    domain: problemStatement.domain,
    tags: problemStatement.tags,
    teamSize: problemStatement.teamSize,
    durationWeeks: problemStatement.durationWeeks,
    difficulty: problemStatement.difficulty,
    status: problemStatement.status,
    featured: problemStatement.featured,
    deliverables: problemStatement.deliverables.map((d) => ({ title: d.title, done: d.done })),
    bookmarked: row.bookmarked,
    isMine: row.isMine,
    interested: row.interested,
    updatedAt: problemStatement.updatedAt.toISOString(),
  };
}
