import { Role } from '@forge-loom/shared-types';
import type { MilestoneFeedback, MilestoneSubmission, Sprint, SprintTask } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { enqueueInvestorUnlockCheck } from '../../jobs/citadelQueue.js';
import { recordScoreEvent } from '../scoring/scoreEvent.service.js';
import { createNotification } from '../notifications/notification.service.js';
import type { TeamWithMembers } from '../teams/team.service.js';
import type { AuthenticatedUser } from '../../middleware/authenticate.js';
import type {
  AddFeedbackInput,
  ReplaceTasksInput,
  SubmitMilestoneInput,
} from './sprint.validation.js';

export type SprintWithTasks = Sprint & { tasks: SprintTask[] };
export type MilestoneSubmissionWithFeedback = MilestoneSubmission & {
  mentorFeedback: MilestoneFeedback[];
};

const TASKS_INCLUDE = { tasks: { orderBy: { order: 'asc' as const } } };
const MEMBERS_INCLUDE = { members: true };

// Doc didn't specify a cycle length — 2 weeks per cycle is a disclosed,
// reasonable default for materializing start/end dates.
const SPRINT_DURATION_WEEKS = 2;

export async function ensureSprintsForTeam(team: { id: string }): Promise<void> {
  const existing = await prisma.sprint.count({ where: { teamId: team.id } });
  if (existing > 0) {
    return;
  }

  const baseDate = new Date();
  const cycles = [1, 2, 3].map((cycleNumber) => {
    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() + (cycleNumber - 1) * SPRINT_DURATION_WEEKS * 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + SPRINT_DURATION_WEEKS * 7);
    return {
      teamId: team.id,
      cycleNumber,
      status: cycleNumber === 1 ? ('in_progress' as const) : ('not_started' as const),
      startDate,
      endDate,
      progressPercent: 0,
    };
  });

  await prisma.sprint.createMany({ data: cycles });
}

function isTeamMember(team: TeamWithMembers, userId: string): boolean {
  return team.members.some((m) => m.studentUserId === userId);
}

function isTeamMentor(team: TeamWithMembers, userId: string): boolean {
  return team.mentorId === userId;
}

function isTeamTrainer(team: TeamWithMembers, userId: string): boolean {
  return team.trainerId === userId;
}

async function canViewTeam(team: TeamWithMembers, viewer: AuthenticatedUser): Promise<boolean> {
  if (viewer.role === Role.ForgeAdmin) return true;
  if (viewer.role === Role.CollegeAdmin) return team.collegeId === viewer.collegeId;
  return (
    isTeamMember(team, viewer.userId) ||
    isTeamMentor(team, viewer.userId) ||
    isTeamTrainer(team, viewer.userId)
  );
}

async function requireTeam(teamId: string): Promise<TeamWithMembers> {
  const team = await prisma.team.findUnique({ where: { id: teamId }, include: MEMBERS_INCLUDE });
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }
  return team;
}

export async function getMyTeam(studentUserId: string): Promise<TeamWithMembers | null> {
  return prisma.team.findFirst({
    where: { members: { some: { studentUserId } } },
    include: MEMBERS_INCLUDE,
  });
}

export interface TeamSprintsView {
  team: TeamWithMembers;
  sprints: SprintWithTasks[];
  submissionsBySprintId: Map<string, MilestoneSubmissionWithFeedback[]>;
  problemStatementTitle: string | null;
  trainerEmail: string | null;
  mentorEmail: string | null;
  investorAccessGranted: boolean;
}

export async function getTeamSprintsView(
  teamId: string,
  viewer: AuthenticatedUser
): Promise<TeamSprintsView> {
  const team = await requireTeam(teamId);
  if (!(await canViewTeam(team, viewer))) {
    throw new ApiError(403, 'You do not have access to this team');
  }

  const sprints = await prisma.sprint.findMany({
    where: { teamId },
    orderBy: { cycleNumber: 'asc' },
    include: TASKS_INCLUDE,
  });
  const submissions = await prisma.milestoneSubmission.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
    include: { mentorFeedback: true },
  });
  const submissionsBySprintId = new Map<string, MilestoneSubmissionWithFeedback[]>();
  for (const submission of submissions) {
    const bucket = submissionsBySprintId.get(submission.sprintId) ?? [];
    bucket.push(submission);
    submissionsBySprintId.set(submission.sprintId, bucket);
  }

  const [problemStatement, trainer, mentor, investorGrant] = await Promise.all([
    team.problemStatementId
      ? prisma.problemStatement.findUnique({ where: { id: team.problemStatementId } })
      : null,
    team.trainerId ? prisma.user.findUnique({ where: { id: team.trainerId } }) : null,
    team.mentorId ? prisma.user.findUnique({ where: { id: team.mentorId } }) : null,
    prisma.investorAccessGrant.findUnique({ where: { teamId } }),
  ]);

  return {
    team,
    sprints,
    submissionsBySprintId,
    problemStatementTitle: problemStatement?.title ?? null,
    trainerEmail: trainer?.email ?? null,
    mentorEmail: mentor?.email ?? null,
    investorAccessGranted: Boolean(investorGrant),
  };
}

async function getOwnedSprint(sprintId: string) {
  const sprint = await prisma.sprint.findUnique({ where: { id: sprintId }, include: TASKS_INCLUDE });
  if (!sprint) {
    throw new ApiError(404, 'Sprint not found');
  }
  const team = await requireTeam(sprint.teamId);
  return { sprint, team };
}

export async function replaceTasks(
  sprintId: string,
  viewer: AuthenticatedUser,
  input: ReplaceTasksInput
): Promise<SprintWithTasks> {
  const { team } = await getOwnedSprint(sprintId);
  if (!isTeamMember(team, viewer.userId)) {
    throw new ApiError(403, 'Only team members can edit this sprint');
  }

  const total = input.tasks.length;
  const completed = input.tasks.filter((task) => task.status === 'completed').length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  await prisma.$transaction([
    prisma.sprintTask.deleteMany({ where: { sprintId } }),
    prisma.sprint.update({
      where: { id: sprintId },
      data: {
        progressPercent,
        tasks: {
          create: input.tasks.map((task, order) => ({
            title: task.title,
            status: task.status,
            dueDate: new Date(task.dueDate),
            order,
          })),
        },
      },
    }),
  ]);

  return prisma.sprint.findUniqueOrThrow({ where: { id: sprintId }, include: TASKS_INCLUDE });
}

export async function submitMilestone(
  sprintId: string,
  viewer: AuthenticatedUser,
  input: SubmitMilestoneInput
): Promise<MilestoneSubmissionWithFeedback> {
  const { sprint, team } = await getOwnedSprint(sprintId);
  if (!isTeamMember(team, viewer.userId)) {
    throw new ApiError(403, 'Only team members can submit a milestone');
  }
  if (sprint.status !== 'in_progress') {
    throw new ApiError(400, `Cannot submit a milestone for a sprint in "${sprint.status}" status`);
  }

  const submission = await prisma.milestoneSubmission.create({
    data: {
      sprintId: sprint.id,
      teamId: team.id,
      artifactUrls: input.artifactUrls,
      demoDate: input.demoDate ? new Date(input.demoDate) : null,
    },
    include: { mentorFeedback: true },
  });

  await prisma.sprint.update({ where: { id: sprintId }, data: { status: 'submitted' } });
  return submission;
}

export async function addFeedback(
  sprintId: string,
  viewer: AuthenticatedUser,
  input: AddFeedbackInput
): Promise<SprintWithTasks> {
  const { sprint, team } = await getOwnedSprint(sprintId);
  if (!isTeamMentor(team, viewer.userId)) {
    throw new ApiError(403, "Only this team's mentor can leave feedback");
  }
  if (sprint.status !== 'submitted') {
    throw new ApiError(400, `Cannot review a sprint in "${sprint.status}" status`);
  }

  const latest = await prisma.milestoneSubmission.findFirst({
    where: { sprintId: sprint.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!latest) {
    throw new ApiError(400, 'No milestone submission to review yet');
  }

  await prisma.milestoneFeedback.create({
    data: {
      milestoneSubmissionId: latest.id,
      mentorId: viewer.userId,
      comment: input.comment,
      rating: input.rating,
    },
  });

  const updatedSprint = await prisma.sprint.update({
    where: { id: sprintId },
    data: { status: 'reviewed' },
    include: TASKS_INCLUDE,
  });

  await Promise.all(
    team.members.map(async (member) => {
      const id = member.studentUserId;
      if (input.rating !== undefined) {
        // Ratings average, rather than sum, into the Mentor category — see
        // scoreWorker.ts's `average()` for why.
        await recordScoreEvent(
          id,
          'mentor',
          input.rating * 20,
          `Mentor feedback (${input.rating}/5) on Sprint Cycle ${sprint.cycleNumber}`,
          sprint.id
        );
      }
      await createNotification(
        id,
        'milestone_reviewed',
        `Sprint Cycle ${sprint.cycleNumber} reviewed`,
        input.comment
      );
    })
  );

  return updatedSprint;
}

export async function completeSprint(
  sprintId: string,
  viewer: AuthenticatedUser
): Promise<SprintWithTasks> {
  const { sprint, team } = await getOwnedSprint(sprintId);
  if (!isTeamMentor(team, viewer.userId)) {
    throw new ApiError(403, "Only this team's mentor can mark a sprint complete");
  }
  if (sprint.status !== 'reviewed') {
    throw new ApiError(400, `Cannot complete a sprint in "${sprint.status}" status`);
  }

  const updated = await prisma.sprint.update({
    where: { id: sprintId },
    data: { status: 'complete' },
    include: TASKS_INCLUDE,
  });

  const nextSprint = await prisma.sprint.findUnique({
    where: { teamId_cycleNumber: { teamId: team.id, cycleNumber: sprint.cycleNumber + 1 } },
  });
  if (nextSprint && nextSprint.status === 'not_started') {
    await prisma.sprint.update({ where: { id: nextSprint.id }, data: { status: 'in_progress' } });
  }

  // One completed cycle is worth 1/3 of the Project category (3 cycles ==
  // 100), for every member of the team.
  await Promise.all(
    team.members.map((member) =>
      recordScoreEvent(
        member.studentUserId,
        'project',
        100 / 3,
        `Completed Sprint Cycle ${sprint.cycleNumber}`,
        sprint.id
      )
    )
  );

  // Async, off the request path — the worker re-checks all 3 cycles and
  // grants investor access exactly once, idempotently.
  await enqueueInvestorUnlockCheck(team.id);

  return updated;
}
