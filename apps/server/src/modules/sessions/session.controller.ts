import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { markAttendanceSchema, updateSessionSchema } from './session.validation.js';
import * as sessionService from './session.service.js';
import { toAttendanceHistoryEntryDto, toSessionDto } from './session.mapper.js';

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

export async function listSessions(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const sessions = await sessionService.listCourseSessions(requireParam(req, 'id'), user);
  res.json({ sessions: sessions.map(toSessionDto) });
}

export async function getRoster(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const roster = await sessionService.getRoster(requireParam(req, 'id'), user.userId);
  res.json({ roster });
}

export async function updateSession(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = updateSessionSchema.parse(req.body);
  const session = await sessionService.updateSession(requireParam(req, 'id'), user.userId, input);
  res.json({ session: toSessionDto(session) });
}

export async function markAttendance(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = markAttendanceSchema.parse(req.body);
  const session = await sessionService.markAttendance(requireParam(req, 'id'), user.userId, input);
  res.json({ session: toSessionDto(session) });
}

export async function getStudentAttendance(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const courseId = req.query.courseId;
  if (typeof courseId !== 'string') {
    throw new ApiError(400, 'Missing required query parameter: courseId');
  }
  const rows = await sessionService.getStudentAttendance(requireParam(req, 'id'), courseId, user);
  res.json({ attendance: rows.map(toAttendanceHistoryEntryDto) });
}
