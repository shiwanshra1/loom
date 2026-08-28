import { Role } from '@forge-loom/shared-types';
import type { Types } from 'mongoose';
import { TeamModel, type TeamDocument } from '../../models/Team.js';
import { StudentProfileModel } from '../../models/StudentProfile.js';
import { TrainerProfileModel } from '../../models/TrainerProfile.js';
import { UserModel } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import type { AuthenticatedUser } from '../../middleware/authenticate.js';
import type { CreateTeamInput, UpdateTeamInput } from './team.validation.js';

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

  const team = await TeamModel.create({
    name: input.name,
    collegeId,
    memberStudentIds,
    mentorId,
    trainerId,
  });

  if (trainerId) {
    await TrainerProfileModel.updateOne(
      { userId: trainerId },
      { $addToSet: { assignedTeams: team._id } }
    );
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

  await team.save();
  return team;
}
