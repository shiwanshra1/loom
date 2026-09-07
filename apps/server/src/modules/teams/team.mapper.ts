import type { TeamDto } from '@forge-loom/shared-types';
import { prisma } from '../../config/prisma.js';
import type { TeamWithMembers } from './team.service.js';

export async function toTeamDto(team: TeamWithMembers): Promise<TeamDto> {
  const profiles = await prisma.studentProfile.findMany({
    where: { userId: { in: team.members.map((m) => m.studentUserId) } },
  });
  const nameByUserId = new Map(profiles.map((p) => [p.userId, p.name]));

  return {
    id: team.id,
    name: team.name,
    collegeId: team.collegeId,
    members: team.members.map((m) => ({
      studentId: m.studentUserId,
      name: nameByUserId.get(m.studentUserId) ?? 'Unknown student',
    })),
    mentorId: team.mentorId,
    trainerId: team.trainerId,
    problemStatementId: team.problemStatementId,
  };
}
