import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { upsertVideoProgressSchema } from './videoProgress.validation.js';
import * as videoProgressService from './videoProgress.service.js';
import { toVideoProgressDto } from './videoProgress.mapper.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
}

export async function upsert(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = upsertVideoProgressSchema.parse(req.body);
  const progress = await videoProgressService.upsertVideoProgress(user.userId, input);
  res.json({ progress: toVideoProgressDto(progress) });
}

export async function list(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const courseId = req.query.courseId;
  if (typeof courseId !== 'string') {
    throw new ApiError(400, 'Missing required query parameter: courseId');
  }
  const progress = await videoProgressService.listVideoProgress(user.userId, courseId);
  res.json({ progress: progress.map(toVideoProgressDto) });
}
