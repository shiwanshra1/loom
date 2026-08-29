import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import * as accessRequestService from './accessRequest.service.js';
import { toAccessRequestDto } from './accessRequest.mapper.js';

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
  const eventId = requireParam(req, 'eventId');
  const request = await accessRequestService.requestAccess(user.userId, eventId);
  res.status(201).json({ request: toAccessRequestDto(request, '') });
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const rows = await accessRequestService.listMyAccessRequests(user.userId);
  res.json({
    requests: rows.map((row) => toAccessRequestDto(row.request, row.eventTitle)),
  });
}

export async function decide(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const requestId = requireParam(req, 'id');
  const approve = req.body?.approve === true;
  const request = await accessRequestService.decideAccessRequest(user.userId, requestId, approve);
  res.json({ request: toAccessRequestDto(request, '') });
}
