import type { MilestoneSubmissionDto, SprintDto, TeamSprintsDto } from '@forge-loom/shared-types';
import type { MilestoneSubmissionWithFeedback, SprintWithTasks, TeamSprintsView } from './sprint.service.js';

export function toSprintDto(sprint: SprintWithTasks): SprintDto {
  return {
    id: sprint.id,
    teamId: sprint.teamId,
    cycleNumber: sprint.cycleNumber,
    status: sprint.status,
    startDate: sprint.startDate.toISOString(),
    endDate: sprint.endDate.toISOString(),
    tasks: sprint.tasks.map((task) => ({
      title: task.title,
      status: task.status,
      dueDate: task.dueDate.toISOString(),
    })),
    progressPercent: sprint.progressPercent,
  };
}

export function toMilestoneSubmissionDto(
  submission: MilestoneSubmissionWithFeedback
): MilestoneSubmissionDto {
  return {
    id: submission.id,
    sprintId: submission.sprintId,
    artifactUrls: submission.artifactUrls,
    demoDate: submission.demoDate ? submission.demoDate.toISOString() : null,
    mentorFeedback: submission.mentorFeedback.map((entry) => ({
      mentorId: entry.mentorId,
      comment: entry.comment,
      rating: entry.rating ?? undefined,
      createdAt: entry.createdAt.toISOString(),
    })),
    createdAt: submission.createdAt.toISOString(),
  };
}

export function toTeamSprintsDto(view: TeamSprintsView): TeamSprintsDto {
  const submissionsBySprintId: Record<string, MilestoneSubmissionDto[]> = {};
  for (const [sprintId, submissions] of view.submissionsBySprintId) {
    submissionsBySprintId[sprintId] = submissions.map(toMilestoneSubmissionDto);
  }

  return {
    team: {
      id: view.team.id,
      name: view.team.name,
      problemStatementTitle: view.problemStatementTitle,
      trainerEmail: view.trainerEmail,
      mentorEmail: view.mentorEmail,
      memberCount: view.team.members.length,
    },
    sprints: view.sprints.map(toSprintDto),
    submissionsBySprintId,
    investorAccessGranted: view.investorAccessGranted,
  };
}
