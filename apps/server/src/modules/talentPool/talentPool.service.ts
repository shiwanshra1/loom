import { Prisma, type StudentProfile } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import type { SearchTalentPoolInput } from './talentPool.validation.js';

interface Cursor {
  score: number;
  id: string;
}

function encodeCursor(profile: StudentProfile): string {
  const cursor: Cursor = { score: profile.builderScore, id: profile.id };
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

function decodeCursor(raw: string): Cursor {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as Cursor;
    if (typeof parsed.score !== 'number' || typeof parsed.id !== 'string') {
      throw new Error('malformed');
    }
    return parsed;
  } catch {
    throw new ApiError(400, 'Invalid cursor');
  }
}

export interface TalentSearchResult {
  profiles: StudentProfile[];
  nextCursor: string | null;
}

// Escapes Postgres LIKE/ILIKE wildcards so a literal search for e.g. "50%"
// matches literally rather than being interpreted as a pattern.
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

export async function searchTalentPool(input: SearchTalentPoolInput): Promise<TalentSearchResult> {
  const limit = input.limit ?? 20;
  const conditions: Prisma.Sql[] = [];

  if (input.domain) {
    conditions.push(Prisma.sql`"domain" = ${input.domain}`);
  }
  if (input.query) {
    // Prisma's type-safe query builder has no way to express "substring match
    // against any element of a text[] column" — this is the one place in the
    // module that needs a raw (but fully parameterized) query. The design doc
    // flags a proper tsvector/pg_trgm upgrade as future work once this needs
    // to be fast at real scale; this preserves the original Mongo regex
    // search's behavior exactly in the meantime.
    const pattern = `%${escapeLikePattern(input.query)}%`;
    conditions.push(
      Prisma.sql`("name" ILIKE ${pattern} ESCAPE '\\' OR EXISTS (SELECT 1 FROM unnest("skills") AS skill WHERE skill ILIKE ${pattern} ESCAPE '\\'))`
    );
  }
  if (input.minScore !== undefined) {
    conditions.push(Prisma.sql`"builderScore" >= ${input.minScore}`);
  }
  if (input.cursor) {
    const cursor = decodeCursor(input.cursor);
    conditions.push(
      Prisma.sql`("builderScore" < ${cursor.score} OR ("builderScore" = ${cursor.score} AND "id" < ${cursor.id}))`
    );
  }

  const whereClause =
    conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;

  const profiles = await prisma.$queryRaw<StudentProfile[]>(
    Prisma.sql`SELECT * FROM "StudentProfile" ${whereClause} ORDER BY "builderScore" DESC, "id" DESC LIMIT ${limit + 1}`
  );

  const hasMore = profiles.length > limit;
  const page = hasMore ? profiles.slice(0, limit) : profiles;
  const last = page[page.length - 1];

  return {
    profiles: page,
    nextCursor: hasMore && last ? encodeCursor(last) : null,
  };
}
