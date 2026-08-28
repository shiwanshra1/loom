import type { TeamDto } from '@forge-loom/shared-types';
import type { TeamDocument } from '../../models/Team.js';
import { StudentProfileModel } from '../../models/StudentProfile.js';

export async function toTeamDto(team: TeamDocument): Promise<TeamDto> {
  const profiles = await StudentProfileModel.find({ userId: { $in: team.memberStudentIds } });
  const nameByUserId = new Map(profiles.map((p) => [p.userId.toString(), p.name]));

  return {
    id: team._id.toString(),
    name: team.name,
    collegeId: team.collegeId.toString(),
    members: team.memberStudentIds.map((id) => ({
      studentId: id.toString(),
      name: nameByUserId.get(id.toString()) ?? 'Unknown student',
    })),
    mentorId: team.mentorId ? team.mentorId.toString() : null,
    trainerId: team.trainerId ? team.trainerId.toString() : null,
    problemStatementId: team.problemStatementId ? team.problemStatementId.toString() : null,
  };
}
