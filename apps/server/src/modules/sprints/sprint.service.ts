import { Types } from 'mongoose';
import { Role } from '@forge-loom/shared-types';
import { SprintModel, type SprintDocument } from '../../models/Sprint.js';
import { TeamModel, type TeamDocument } from '../../models/Team.js';
import {
  MilestoneSubmissionModel,
  type MilestoneSubmissionDocument,
} from '../../models/MilestoneSubmission.js';
import { ProblemStatementModel } from '../../models/ProblemStatement.js';
import { InvestorAccessGrantModel } from '../../models/InvestorAccessGrant.js';
import { UserModel } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { enqueueInvestorUnlockCheck } from '../../jobs/citadelQueue.js';
import { recordScoreEvent } from '../scoring/scoreEvent.service.js';
import { createNotification } from '../notifications/notification.service.js';
import type { AuthenticatedUser } from '../../middleware/authenticate.js';
import type {
  AddFeedbackInput,
  ReplaceTasksInput,
  SubmitMilestoneInput,
} from './sprint.validation.js';

// Doc didn't specify a cycle length — 2 weeks per cycle is a disclosed,
// reasonable default for materializing start/end dates.
const SPRINT_DURATION_WEEKS = 2;

export async function ensureSprintsForTeam(team: TeamDocument): Promise<void> {
  const existing = await SprintModel.countDocuments({ teamId: team._id });
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
      teamId: team._id,
      cycleNumber,
      status: cycleNumber === 1 ? ('in_progress' as const) : ('not_started' as const),
      startDate,
      endDate,
      tasks: [],
      progressPercent: 0,
    };
  });

  await SprintModel.insertMany(cycles);
}

function isTeamMember(team: TeamDocument, userId: string): boolean {
  return team.memberStudentIds.some((id) => id.toString() === userId);
}

function isTeamMentor(team: TeamDocument, userId: string): boolean {
  return Boolean(team.mentorId) && team.mentorId?.toString() === userId;
}

function isTeamTrainer(team: TeamDocument, userId: string): boolean {
  return Boolean(team.trainerId) && team.trainerId?.toString() === userId;
}

async function canViewTeam(team: TeamDocument, viewer: AuthenticatedUser): Promise<boolean> {
  if (viewer.role === Role.ForgeAdmin) return true;
  if (viewer.role === Role.CollegeAdmin) return team.collegeId.toString() === viewer.collegeId;
  return (
    isTeamMember(team, viewer.userId) ||
    isTeamMentor(team, viewer.userId) ||
    isTeamTrainer(team, viewer.userId)
  );
}

async function requireTeam(teamId: string): Promise<TeamDocument> {
  const team = await TeamModel.findById(teamId);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }
  return team;
}

export async function getMyTeam(studentUserId: string): Promise<TeamDocument | null> {
  return TeamModel.findOne({ memberStudentIds: studentUserId });
}

export interface TeamSprintsView {
  team: TeamDocument;
  sprints: SprintDocument[];
  submissionsBySprintId: Map<string, MilestoneSubmissionDocument[]>;
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

  const sprints = await SprintModel.find({ teamId }).sort({ cycleNumber: 1 });
  const submissions = await MilestoneSubmissionModel.find({ teamId }).sort({ createdAt: -1 });
  const submissionsBySprintId = new Map<string, MilestoneSubmissionDocument[]>();
  for (const submission of submissions) {
    const key = submission.sprintId.toString();
    const bucket = submissionsBySprintId.get(key) ?? [];
    bucket.push(submission);
    submissionsBySprintId.set(key, bucket);
  }

  const [problemStatement, trainer, mentor, investorGrant] = await Promise.all([
    team.problemStatementId ? ProblemStatementModel.findById(team.problemStatementId) : null,
    team.trainerId ? UserModel.findById(team.trainerId) : null,
    team.mentorId ? UserModel.findById(team.mentorId) : null,
    InvestorAccessGrantModel.exists({ teamId }),
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
  const sprint = await SprintModel.findById(sprintId);
  if (!sprint) {
    throw new ApiError(404, 'Sprint not found');
  }
  const team = await requireTeam(sprint.teamId.toString());
  return { sprint, team };
}

export async function replaceTasks(
  sprintId: string,
  viewer: AuthenticatedUser,
  input: ReplaceTasksInput
): Promise<SprintDocument> {
  const { sprint, team } = await getOwnedSprint(sprintId);
  if (!isTeamMember(team, viewer.userId)) {
    throw new ApiError(403, 'Only team members can edit this sprint');
  }

  sprint.tasks = input.tasks.map((task) => ({
    title: task.title,
    status: task.status,
    dueDate: new Date(task.dueDate),
  }));
  const total = sprint.tasks.length;
  const completed = sprint.tasks.filter((task) => task.status === 'completed').length;
  sprint.progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  await sprint.save();
  return sprint;
}

export async function submitMilestone(
  sprintId: string,
  viewer: AuthenticatedUser,
  input: SubmitMilestoneInput
): Promise<MilestoneSubmissionDocument> {
  const { sprint, team } = await getOwnedSprint(sprintId);
  if (!isTeamMember(team, viewer.userId)) {
    throw new ApiError(403, 'Only team members can submit a milestone');
  }
  if (sprint.status !== 'in_progress') {
    throw new ApiError(400, `Cannot submit a milestone for a sprint in "${sprint.status}" status`);
  }

  const submission = await MilestoneSubmissionModel.create({
    sprintId: sprint._id,
    teamId: team._id,
    artifactUrls: input.artifactUrls,
    demoDate: input.demoDate ? new Date(input.demoDate) : null,
  });

  sprint.status = 'submitted';
  await sprint.save();
  return submission;
}

export async function addFeedback(
  sprintId: string,
  viewer: AuthenticatedUser,
  input: AddFeedbackInput
): Promise<SprintDocument> {
  const { sprint, team } = await getOwnedSprint(sprintId);
  if (!isTeamMentor(team, viewer.userId)) {
    throw new ApiError(403, "Only this team's mentor can leave feedback");
  }
  if (sprint.status !== 'submitted') {
    throw new ApiError(400, `Cannot review a sprint in "${sprint.status}" status`);
  }

  const latest = await MilestoneSubmissionModel.findOne({ sprintId: sprint._id }).sort({
    createdAt: -1,
  });
  if (!latest) {
    throw new ApiError(400, 'No milestone submission to review yet');
  }

  latest.mentorFeedback.push({
    mentorId: new Types.ObjectId(viewer.userId),
    comment: input.comment,
    rating: input.rating,
    createdAt: new Date(),
  });
  await latest.save();

  sprint.status = 'reviewed';
  await sprint.save();

  await Promise.all(
    team.memberStudentIds.map(async (studentId) => {
      const id = studentId.toString();
      if (input.rating !== undefined) {
        // Ratings average, rather than sum, into the Mentor category — see
        // scoreWorker.ts's `average()` for why.
        await recordScoreEvent(
          id,
          'mentor',
          input.rating * 20,
          `Mentor feedback (${input.rating}/5) on Sprint Cycle ${sprint.cycleNumber}`,
          sprint._id.toString()
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

  return sprint;
}

export async function completeSprint(
  sprintId: string,
  viewer: AuthenticatedUser
): Promise<SprintDocument> {
  const { sprint, team } = await getOwnedSprint(sprintId);
  if (!isTeamMentor(team, viewer.userId)) {
    throw new ApiError(403, "Only this team's mentor can mark a sprint complete");
  }
  if (sprint.status !== 'reviewed') {
    throw new ApiError(400, `Cannot complete a sprint in "${sprint.status}" status`);
  }

  sprint.status = 'complete';
  await sprint.save();

  const nextSprint = await SprintModel.findOne({
    teamId: team._id,
    cycleNumber: sprint.cycleNumber + 1,
  });
  if (nextSprint && nextSprint.status === 'not_started') {
    nextSprint.status = 'in_progress';
    await nextSprint.save();
  }

  // One completed cycle is worth 1/3 of the Project category (3 cycles ==
  // 100), for every member of the team.
  await Promise.all(
    team.memberStudentIds.map((studentId) =>
      recordScoreEvent(
        studentId.toString(),
        'project',
        100 / 3,
        `Completed Sprint Cycle ${sprint.cycleNumber}`,
        sprint._id.toString()
      )
    )
  );

  // Async, off the request path — the worker re-checks all 3 cycles and
  // grants investor access exactly once, idempotently.
  await enqueueInvestorUnlockCheck(team._id.toString());

  return sprint;
}
