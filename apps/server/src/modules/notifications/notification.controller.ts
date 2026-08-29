import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import * as notificationService from './notification.service.js';
import { toNotificationDto } from './notification.mapper.js';

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

export async function listMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const notifications = await notificationService.listMyNotifications(user.userId);
  res.json({ notifications: notifications.map(toNotificationDto) });
}

export async function markRead(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  await notificationService.markRead(user.userId, requireParam(req, 'id'));
  res.status(204).send();
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  await notificationService.markAllRead(user.userId);
  res.status(204).send();
}
