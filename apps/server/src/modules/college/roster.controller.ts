import type { Request, Response } from 'express';
import { Role } from '@forge-loom/shared-types';
import { ApiError } from '../../utils/ApiError.js';
import {
  bulkCreateStudentsSchema,
  createRosterMemberSchema,
  sendWelcomeEmailsSchema,
  updateStudentBatchSchema,
} from './roster.validation.js';
import * as rosterService from './roster.service.js';
import {
  toBulkCreateStudentsResultDto,
  toCreateRosterMemberResultDto,
  toRosterStudentDto,
} from './roster.mapper.js';

function requireCollegeId(req: Request): string {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  if (!req.user.collegeId) {
    throw new ApiError(403, 'This account is not associated with a college');
  }
  return req.user.collegeId;
}

function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) {
    throw new ApiError(400, `Missing required parameter: ${name}`);
  }
  return value;
}

async function createRosterMember(req: Request, res: Response, role: 'student' | 'mentor' | 'trainer') {
  const collegeId = requireCollegeId(req);
  const input = createRosterMemberSchema.parse(req.body);
  const roleMap = { student: Role.Student, mentor: Role.Mentor, trainer: Role.Trainer } as const;
  const result = await rosterService.createRosterMember(roleMap[role], collegeId, input);
  res.status(201).json(toCreateRosterMemberResultDto(result));
}

export async function createStudent(req: Request, res: Response): Promise<void> {
  await createRosterMember(req, res, 'student');
}

export async function createMentor(req: Request, res: Response): Promise<void> {
  await createRosterMember(req, res, 'mentor');
}

export async function createTrainer(req: Request, res: Response): Promise<void> {
  await createRosterMember(req, res, 'trainer');
}

export async function listStudents(req: Request, res: Response): Promise<void> {
  const collegeId = requireCollegeId(req);
  const rows = await rosterService.listStudents(collegeId);
  res.json({ students: rows.map(toRosterStudentDto) });
}

export async function updateStudentBatch(req: Request, res: Response): Promise<void> {
  const collegeId = requireCollegeId(req);
  const studentUserId = requireParam(req, 'id');
  const input = updateStudentBatchSchema.parse(req.body);
  const row = await rosterService.updateStudentBatch(collegeId, studentUserId, input);
  res.json({ student: toRosterStudentDto(row) });
}

export async function bulkCreateStudents(req: Request, res: Response): Promise<void> {
  const collegeId = requireCollegeId(req);
  const input = bulkCreateStudentsSchema.parse(req.body);
  const results = await rosterService.bulkCreateStudents(collegeId, input.rows);
  // 207 Multi-Status — the request as a whole succeeded, but individual rows
  // may have failed; the per-row results carry the real outcome.
  res.status(207).json(toBulkCreateStudentsResultDto(results));
}

export async function sendWelcomeEmails(req: Request, res: Response): Promise<void> {
  const collegeId = requireCollegeId(req);
  const input = sendWelcomeEmailsSchema.parse(req.body);
  const result = await rosterService.sendWelcomeEmails(collegeId, input.accounts);
  res.json(result);
}
