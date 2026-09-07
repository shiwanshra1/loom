import { Role } from '@forge-loom/shared-types';
import type { ProblemStatement, ProblemStatementDeliverable } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import type { AuthenticatedUser } from '../../middleware/authenticate.js';
import type { CreateProblemStatementInput } from './problemStatement.validation.js';

export type ProblemStatementWithDeliverables = ProblemStatement & {
  deliverables: ProblemStatementDeliverable[];
};

export interface ProblemStatementRow {
  problemStatement: ProblemStatementWithDeliverables;
  bookmarked: boolean;
  isMine: boolean;
  interested: boolean;
}

const DELIVERABLES_INCLUDE = { deliverables: { orderBy: { order: 'asc' as const } } };

export async function createProblemStatement(
  postedBy: string,
  input: CreateProblemStatementInput
): Promise<ProblemStatementWithDeliverables> {
  const deliverables = (input.deliverables ?? []).map((d, order) => ({
    title: d.title,
    done: d.done ?? false,
    order,
  }));

  return prisma.problemStatement.create({
    data: {
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
      postedBy,
      deliverables: { create: deliverables },
    },
    include: DELIVERABLES_INCLUDE,
  });
}

export async function listProblemStatements(
  viewer: AuthenticatedUser | undefined
): Promise<ProblemStatementRow[]> {
  const all = await prisma.problemStatement.findMany({
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    include: DELIVERABLES_INCLUDE,
  });

  if (!viewer || viewer.role !== Role.Student) {
    return all.map((problemStatement) => ({
      problemStatement,
      bookmarked: false,
      isMine: false,
      interested: false,
    }));
  }

  const [bookmarks, interests, myTeam] = await Promise.all([
    prisma.bookmark.findMany({ where: { userId: viewer.userId } }),
    prisma.interestExpression.findMany({ where: { userId: viewer.userId } }),
    prisma.team.findFirst({ where: { members: { some: { studentUserId: viewer.userId } } } }),
  ]);
  const bookmarkedIds = new Set(bookmarks.map((b) => b.problemStatementId));
  const interestedIds = new Set(interests.map((i) => i.problemStatementId));
  const myProblemStatementId = myTeam?.problemStatementId ?? undefined;

  return all.map((problemStatement) => ({
    problemStatement,
    bookmarked: bookmarkedIds.has(problemStatement.id),
    isMine: myProblemStatementId === problemStatement.id,
    interested: interestedIds.has(problemStatement.id),
  }));
}

export async function expressInterest(userId: string, problemStatementId: string): Promise<void> {
  const exists = await prisma.problemStatement.findUnique({ where: { id: problemStatementId } });
  if (!exists) {
    throw new ApiError(404, 'Problem statement not found');
  }
  await prisma.interestExpression.upsert({
    where: { userId_problemStatementId: { userId, problemStatementId } },
    update: {},
    create: { userId, problemStatementId },
  });
}

export async function toggleBookmark(userId: string, problemStatementId: string): Promise<boolean> {
  const existing = await prisma.bookmark.findUnique({
    where: { userId_problemStatementId: { userId, problemStatementId } },
  });
  if (existing) {
    await prisma.bookmark.delete({
      where: { userId_problemStatementId: { userId, problemStatementId } },
    });
    return false;
  }
  await prisma.bookmark.create({ data: { userId, problemStatementId } });
  return true;
}
