import { Role } from '@forge-loom/shared-types';
import {
  ProblemStatementModel,
  type ProblemStatementDocument,
} from '../../models/ProblemStatement.js';
import { BookmarkModel } from '../../models/Bookmark.js';
import { InterestExpressionModel } from '../../models/InterestExpression.js';
import { TeamModel } from '../../models/Team.js';
import { ApiError } from '../../utils/ApiError.js';
import type { AuthenticatedUser } from '../../middleware/authenticate.js';
import type { CreateProblemStatementInput } from './problemStatement.validation.js';

export interface ProblemStatementRow {
  problemStatement: ProblemStatementDocument;
  bookmarked: boolean;
  isMine: boolean;
  interested: boolean;
}

export async function createProblemStatement(
  postedBy: string,
  input: CreateProblemStatementInput
): Promise<ProblemStatementDocument> {
  return ProblemStatementModel.create({
    title: input.title,
    description: input.description,
    overview: input.overview,
    source: input.source,
    domain: input.domain,
    tags: input.tags ?? [],
    teamSize: input.teamSize,
    durationWeeks: input.durationWeeks,
    difficulty: input.difficulty,
    featured: input.featured ?? false,
    deliverables: (input.deliverables ?? []).map((d) => ({
      title: d.title,
      done: d.done ?? false,
    })),
    postedBy,
  });
}

export async function listProblemStatements(
  viewer: AuthenticatedUser | undefined
): Promise<ProblemStatementRow[]> {
  const all = await ProblemStatementModel.find().sort({ featured: -1, createdAt: -1 });

  if (!viewer || viewer.role !== Role.Student) {
    return all.map((problemStatement) => ({
      problemStatement,
      bookmarked: false,
      isMine: false,
      interested: false,
    }));
  }

  const [bookmarks, interests, myTeam] = await Promise.all([
    BookmarkModel.find({ userId: viewer.userId }),
    InterestExpressionModel.find({ userId: viewer.userId }),
    TeamModel.findOne({ memberStudentIds: viewer.userId }),
  ]);
  const bookmarkedIds = new Set(bookmarks.map((b) => b.problemStatementId.toString()));
  const interestedIds = new Set(interests.map((i) => i.problemStatementId.toString()));
  const myProblemStatementId = myTeam?.problemStatementId?.toString();

  return all.map((problemStatement) => ({
    problemStatement,
    bookmarked: bookmarkedIds.has(problemStatement._id.toString()),
    isMine: myProblemStatementId === problemStatement._id.toString(),
    interested: interestedIds.has(problemStatement._id.toString()),
  }));
}

export async function expressInterest(userId: string, problemStatementId: string): Promise<void> {
  const exists = await ProblemStatementModel.exists({ _id: problemStatementId });
  if (!exists) {
    throw new ApiError(404, 'Problem statement not found');
  }
  await InterestExpressionModel.findOneAndUpdate(
    { userId, problemStatementId },
    { userId, problemStatementId },
    { upsert: true }
  );
}

export async function toggleBookmark(userId: string, problemStatementId: string): Promise<boolean> {
  const existing = await BookmarkModel.findOne({ userId, problemStatementId });
  if (existing) {
    await existing.deleteOne();
    return false;
  }
  await BookmarkModel.create({ userId, problemStatementId });
  return true;
}
