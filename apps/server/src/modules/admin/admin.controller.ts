import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { updateUserStatusSchema } from './admin.validation.js';
import * as adminService from './admin.service.js';
import { getAnalytics as getAnalyticsData } from './analytics.service.js';
import { toAdminUserRowDto } from './admin.mapper.js';

function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) {
    throw new ApiError(400, `Missing required parameter: ${name}`);
  }
  return value;
}

export async function nationalStats(_req: Request, res: Response): Promise<void> {
  const stats = await adminService.getNationalStats();
  res.json(stats);
}

export async function getAnalytics(_req: Request, res: Response): Promise<void> {
  const analytics = await getAnalyticsData();
  res.json(analytics);
}

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const rows = await adminService.listUsers();
  res.json({ users: rows.map(toAdminUserRowDto) });
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  const userId = requireParam(req, 'id');
  const input = updateUserStatusSchema.parse(req.body);
  const user = await adminService.updateUserStatus(userId, input);
  res.json({ user: toAdminUserRowDto({ user, collegeName: null }) });
}
