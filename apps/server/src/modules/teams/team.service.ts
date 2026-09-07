import { Role } from '@forge-loom/shared-types';
import type { Role as PrismaRole, Team, TeamMember } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { toPrismaEnum } from '../../utils/prismaEnum.js';
import { ensureSprintsForTeam } from '../sprints/sprint.service.js';
import type { AuthenticatedUser } from '../../middleware/authenticate.js';
import type { CreateTeamInput, UpdateTeamInput } from './team.validation.js';

export type TeamWithMembers = Team & { members: TeamMember[] };

const MEMBERS_INCLUDE = { members: true };

async function resolveProblemStatementId(problemStatementId: string): Promise<string> {
  const problemStatement = await prisma.problemStatement.findFirst({
    where: { id: problemStatementId, status: 'open' },
  });
  if (!problemStatement) {
    throw new ApiError(400, 'No open problem statement found for the given id');
  }
  return problemStatement.id;
}

interface ResolvedMember {
  studentUserId: string;
  studentProfileId: string;
}

async function resolveMemberIds(collegeId: string, studentIds: string[]): Promise<ResolvedMember[]> {
  const profiles = await prisma.studentProfile.findMany({
    where: { userId: { in: studentIds }, collegeId },
  });
  if (profiles.length !== studentIds.length) {
    throw new ApiError(400, 'One or more student ids are invalid or not at this college');
  }
  return profiles.map((p) => ({ studentUserId: p.userId, studentProfileId: p.id }));
}

async function resolveRoleEmail(collegeId: string, email: string, role: Role): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { email, role: toPrismaEnum<PrismaRole>(role), collegeId },
  });
  if (!user) {
    throw new ApiError(400, `No ${role} account found for ${email} at this college`);
  }
  return user.id;
}

export async function createTeam(
  collegeId: string,
  input: CreateTeamInput
): Promise<TeamWithMembers> {
  const members = input.memberStudentIds
    ? await resolveMemberIds(collegeId, input.memberStudentIds)
    : [];
  const mentorId = input.mentorEmail
    ? await resolveRoleEmail(collegeId, input.mentorEmail, Role.Mentor)
    : null;
  const trainerId = input.trainerEmail
    ? await resolveRoleEmail(collegeId, input.trainerEmail, Role.Trainer)
    : null;
  const problemStatementId = input.problemStatementId
    ? await resolveProblemStatementId(input.problemStatementId)
    : null;

  // No TrainerProfile.assignedTeams[] write here — that field was dropped as
  // redundant during Phase 1; `Team.trainerId` alone is the source of truth
  // (design doc §0.3).
  const team = await prisma.team.create({
    data: {
      name: input.name,
      collegeId,
      mentorId,
      trainerId,
      problemStatementId,
      members: { create: members },
    },
    include: MEMBERS_INCLUDE,
  });

  if (problemStatementId) {
    await ensureSprintsForTeam(team);
  }

  return team;
}

export interface TeamListFilter {
  collegeId?: string;
  trainerId?: string;
  mentorId?: string;
  memberStudentId?: string;
}

export async function listTeams(filter: TeamListFilter): Promise<TeamWithMembers[]> {
  return prisma.team.findMany({
    where: {
      ...(filter.collegeId && { collegeId: filter.collegeId }),
      ...(filter.trainerId && { trainerId: filter.trainerId }),
      ...(filter.mentorId && { mentorId: filter.mentorId }),
      ...(filter.memberStudentId && {
        members: { some: { studentUserId: filter.memberStudentId } },
      }),
    },
    orderBy: { createdAt: 'desc' },
    include: MEMBERS_INCLUDE,
  });
}

function canManageTeam(team: Team, viewer: AuthenticatedUser): boolean {
  if (viewer.role === Role.CollegeAdmin) {
    return team.collegeId === viewer.collegeId;
  }
  if (viewer.role === Role.Trainer) {
    return team.trainerId === viewer.userId;
  }
  return false;
}

export async function updateTeam(
  teamId: string,
  viewer: AuthenticatedUser,
  input: UpdateTeamInput
): Promise<TeamWithMembers> {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }
  if (!canManageTeam(team, viewer)) {
    throw new ApiError(403, 'You do not have access to this team');
  }

  const collegeId = team.collegeId;

  const fieldUpdates = {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.mentorEmail !== undefined && {
      mentorId: await resolveRoleEmail(collegeId, input.mentorEmail, Role.Mentor),
    }),
    ...(input.trainerEmail !== undefined && {
      trainerId: await resolveRoleEmail(collegeId, input.trainerEmail, Role.Trainer),
    }),
    ...(input.problemStatementId !== undefined && {
      problemStatementId: await resolveProblemStatementId(input.problemStatementId),
    }),
  };

  if (input.memberStudentIds !== undefined) {
    // Whole list replaced on update, matching the original Mongoose behavior.
    const members = await resolveMemberIds(collegeId, input.memberStudentIds);
    await prisma.$transaction([
      prisma.teamMember.deleteMany({ where: { teamId } }),
      prisma.team.update({
        where: { id: teamId },
        data: { ...fieldUpdates, members: { create: members } },
      }),
    ]);
  } else if (Object.keys(fieldUpdates).length > 0) {
    await prisma.team.update({ where: { id: teamId }, data: fieldUpdates });
  }

  const updated = await prisma.team.findUniqueOrThrow({
    where: { id: teamId },
    include: MEMBERS_INCLUDE,
  });

  // Materializing sprints is idempotent (no-op if they already exist) — safe
  // to call on every update, not just the update that first sets the field.
  if (updated.problemStatementId) {
    await ensureSprintsForTeam(updated);
  }

  return updated;
}
