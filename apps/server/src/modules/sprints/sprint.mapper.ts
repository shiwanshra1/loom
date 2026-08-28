import type { MilestoneSubmissionDto, SprintDto, TeamSprintsDto } from '@forge-loom/shared-types';
import type { SprintDocument } from '../../models/Sprint.js';
import type { MilestoneSubmissionDocument } from '../../models/MilestoneSubmission.js';
import type { TeamSprintsView } from './sprint.service.js';

export function toSprintDto(sprint: SprintDocument): SprintDto {
  return {
    id: sprint._id.toString(),
    teamId: sprint.teamId.toString(),
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
  submission: MilestoneSubmissionDocument
): MilestoneSubmissionDto {
  return {
    id: submission._id.toString(),
    sprintId: submission.sprintId.toString(),
    artifactUrls: submission.artifactUrls,
    demoDate: submission.demoDate ? submission.demoDate.toISOString() : null,
    mentorFeedback: submission.mentorFeedback.map((entry) => ({
      mentorId: entry.mentorId.toString(),
      comment: entry.comment,
      rating: entry.rating,
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
      id: view.team._id.toString(),
      name: view.team.name,
      problemStatementTitle: view.problemStatementTitle,
      trainerEmail: view.trainerEmail,
      mentorEmail: view.mentorEmail,
      memberCount: view.team.memberStudentIds.length,
    },
    sprints: view.sprints.map(toSprintDto),
    submissionsBySprintId,
    investorAccessGranted: view.investorAccessGranted,
  };
}
