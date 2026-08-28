import { Role } from '@forge-loom/shared-types';
import type { Types } from 'mongoose';
import { TeamModel, type TeamDocument } from '../../models/Team.js';
import { StudentProfileModel } from '../../models/StudentProfile.js';
import { TrainerProfileModel } from '../../models/TrainerProfile.js';
import { UserModel } from '../../models/User.js';
import { ProblemStatementModel } from '../../models/ProblemStatement.js';
import { ApiError } from '../../utils/ApiError.js';
import { ensureSprintsForTeam } from '../sprints/sprint.service.js';
import type { AuthenticatedUser } from '../../middleware/authenticate.js';
import type { CreateTeamInput, UpdateTeamInput } from './team.validation.js';

async function resolveProblemStatementId(problemStatementId: string): Promise<Types.ObjectId> {
  const problemStatement = await ProblemStatementModel.findOne({
    _id: problemStatementId,
    status: 'open',
  });
  if (!problemStatement) {
    throw new ApiError(400, 'No open problem statement found for the given id');
  }
  return problemStatement._id;
}

async function resolveMemberIds(
  collegeId: string,
  studentIds: string[]
): Promise<Types.ObjectId[]> {
  const profiles = await StudentProfileModel.find({ userId: { $in: studentIds }, collegeId });
  if (profiles.length !== studentIds.length) {
    throw new ApiError(400, 'One or more student ids are invalid or not at this college');
  }
  return profiles.map((p) => p.userId);
}

async function resolveRoleEmail(
  collegeId: string,
  email: string,
  role: Role
): Promise<Types.ObjectId> {
  const user = await UserModel.findOne({ email, role, collegeId });
  if (!user) {
    throw new ApiError(400, `No ${role} account found for ${email} at this college`);
  }
  return user._id;
}

export async function createTeam(collegeId: string, input: CreateTeamInput): Promise<TeamDocument> {
  const memberStudentIds = input.memberStudentIds
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

  const team = await TeamModel.create({
    name: input.name,
    collegeId,
    memberStudentIds,
    mentorId,
    trainerId,
    problemStatementId,
  });

  if (trainerId) {
    await TrainerProfileModel.updateOne(
      { userId: trainerId },
      { $addToSet: { assignedTeams: team._id } }
    );
  }
  if (problemStatementId) {
    await ensureSprintsForTeam(team);
  }

  return team;
}

export async function listTeams(filter: Record<string, unknown>): Promise<TeamDocument[]> {
  return TeamModel.find(filter).sort({ createdAt: -1 });
}

function canManageTeam(team: TeamDocument, viewer: AuthenticatedUser): boolean {
  if (viewer.role === Role.CollegeAdmin) {
    return team.collegeId.toString() === viewer.collegeId;
  }
  if (viewer.role === Role.Trainer) {
    return Boolean(team.trainerId) && team.trainerId?.toString() === viewer.userId;
  }
  return false;
}

export async function updateTeam(
  teamId: string,
  viewer: AuthenticatedUser,
  input: UpdateTeamInput
): Promise<TeamDocument> {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }
  if (!canManageTeam(team, viewer)) {
    throw new ApiError(403, 'You do not have access to this team');
  }

  const collegeId = team.collegeId.toString();

  if (input.name !== undefined) {
    team.name = input.name;
  }
  if (input.memberStudentIds !== undefined) {
    team.memberStudentIds = await resolveMemberIds(collegeId, input.memberStudentIds);
  }
  if (input.mentorEmail !== undefined) {
    team.mentorId = await resolveRoleEmail(collegeId, input.mentorEmail, Role.Mentor);
  }
  if (input.trainerEmail !== undefined) {
    const previousTrainerId = team.trainerId;
    const nextTrainerId = await resolveRoleEmail(collegeId, input.trainerEmail, Role.Trainer);
    team.trainerId = nextTrainerId;

    if (previousTrainerId && previousTrainerId.toString() !== nextTrainerId.toString()) {
      await TrainerProfileModel.updateOne(
        { userId: previousTrainerId },
        { $pull: { assignedTeams: team._id } }
      );
    }
    await TrainerProfileModel.updateOne(
      { userId: nextTrainerId },
      { $addToSet: { assignedTeams: team._id } }
    );
  }
  if (input.problemStatementId !== undefined) {
    team.problemStatementId = await resolveProblemStatementId(input.problemStatementId);
  }

  await team.save();

  // Materializing sprints is idempotent (no-op if they already exist) — safe
  // to call on every update, not just the update that first sets the field.
  if (team.problemStatementId) {
    await ensureSprintsForTeam(team);
  }

  return team;
}
