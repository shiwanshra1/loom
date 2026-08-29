import { Types } from 'mongoose';
import { StudentProfileModel, type StudentProfileDocument } from '../../models/StudentProfile.js';
import { ApiError } from '../../utils/ApiError.js';
import type { SearchTalentPoolInput } from './talentPool.validation.js';

interface Cursor {
  score: number;
  id: string;
}

function encodeCursor(doc: StudentProfileDocument): string {
  const cursor: Cursor = { score: doc.builderScore, id: doc._id.toString() };
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
  profiles: StudentProfileDocument[];
  nextCursor: string | null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function searchTalentPool(input: SearchTalentPoolInput): Promise<TalentSearchResult> {
  const limit = input.limit ?? 20;
  const conditions: Record<string, unknown>[] = [];

  if (input.domain) {
    conditions.push({ domain: input.domain });
  }
  if (input.query) {
    const pattern = new RegExp(escapeRegExp(input.query), 'i');
    conditions.push({ $or: [{ name: pattern }, { skills: pattern }] });
  }
  if (input.minScore !== undefined) {
    conditions.push({ builderScore: { $gte: input.minScore } });
  }
  if (input.cursor) {
    const cursor = decodeCursor(input.cursor);
    conditions.push({
      $or: [
        { builderScore: { $lt: cursor.score } },
        { builderScore: cursor.score, _id: { $lt: new Types.ObjectId(cursor.id) } },
      ],
    });
  }

  const filter = conditions.length > 0 ? { $and: conditions } : {};

  const profiles = await StudentProfileModel.find(filter)
    .sort({ builderScore: -1, _id: -1 })
    .limit(limit + 1);

  const hasMore = profiles.length > limit;
  const page = hasMore ? profiles.slice(0, limit) : profiles;
  const last = page[page.length - 1];

  return {
    profiles: page,
    nextCursor: hasMore && last ? encodeCursor(last) : null,
  };
}
