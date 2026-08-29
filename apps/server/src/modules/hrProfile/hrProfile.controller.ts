import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { updateHrProfileSchema } from './hrProfile.validation.js';
import * as hrProfileService from './hrProfile.service.js';
import { toHrCompanyProfileDto } from './hrProfile.mapper.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
}

export async function getMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const profile = await hrProfileService.getMyProfile(user.userId);
  res.json({ profile: toHrCompanyProfileDto(profile) });
}

export async function updateMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = updateHrProfileSchema.parse(req.body);
  const profile = await hrProfileService.updateMyProfile(user.userId, input);
  res.json({ profile: toHrCompanyProfileDto(profile) });
}

export async function directory(_req: Request, res: Response): Promise<void> {
  const entries = await hrProfileService.listDirectory();
  res.json({ entries });
}
