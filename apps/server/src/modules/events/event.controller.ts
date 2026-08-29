import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { createEventSchema } from './event.validation.js';
import * as eventService from './event.service.js';
import { toEventDto } from './event.mapper.js';

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

export async function create(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createEventSchema.parse(req.body);
  const event = await eventService.createEvent(user, input);
  res.status(201).json({
    event: await toEventDto({ event, registeredCount: 0, isRegistered: false }),
  });
}

export async function list(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const collegeId = typeof req.query.collegeId === 'string' ? req.query.collegeId : undefined;
  const rows = await eventService.listEvents(user.userId, collegeId);
  res.json({ events: await Promise.all(rows.map(toEventDto)) });
}

export async function register(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  await eventService.registerForEvent(user.userId, requireParam(req, 'id'));
  res.status(204).send();
}
