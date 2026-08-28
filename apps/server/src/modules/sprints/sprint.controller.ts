import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import {
  addFeedbackSchema,
  replaceTasksSchema,
  submitMilestoneSchema,
} from './sprint.validation.js';
import * as sprintService from './sprint.service.js';
import { toMilestoneSubmissionDto, toSprintDto, toTeamSprintsDto } from './sprint.mapper.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
}

function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) {
    throw new ApiError(400, `Missing required parameter: ${name}`);
  }
  return value;
}

export async function getMySprints(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const team = await sprintService.getMyTeam(user.userId);
  if (!team) {
    throw new ApiError(404, "You aren't on a Citadel team yet");
  }
  const view = await sprintService.getTeamSprintsView(team._id.toString(), user);
  res.json(toTeamSprintsDto(view));
}

export async function getTeamSprints(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const view = await sprintService.getTeamSprintsView(requireParam(req, 'id'), user);
  res.json(toTeamSprintsDto(view));
}

export async function replaceTasks(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = replaceTasksSchema.parse(req.body);
  const sprint = await sprintService.replaceTasks(requireParam(req, 'id'), user, input);
  res.json({ sprint: toSprintDto(sprint) });
}

export async function submitMilestone(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = submitMilestoneSchema.parse(req.body);
  const submission = await sprintService.submitMilestone(requireParam(req, 'id'), user, input);
  res.status(201).json({ submission: toMilestoneSubmissionDto(submission) });
}

export async function addFeedback(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = addFeedbackSchema.parse(req.body);
  const sprint = await sprintService.addFeedback(requireParam(req, 'id'), user, input);
  res.json({ sprint: toSprintDto(sprint) });
}

export async function complete(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const sprint = await sprintService.completeSprint(requireParam(req, 'id'), user);
  res.json({ sprint: toSprintDto(sprint) });
}
