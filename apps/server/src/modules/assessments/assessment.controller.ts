import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { createAssessmentSchema } from './assessment.validation.js';
import * as assessmentService from './assessment.service.js';
import { toAssessmentDto } from './assessment.mapper.js';

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
  const input = createAssessmentSchema.parse(req.body);
  const assessment = await assessmentService.createAssessment(requireParam(req, 'id'), user, input);
  res.status(201).json({ assessment: toAssessmentDto(assessment) });
}

export async function list(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const assessments = await assessmentService.listAssessments(requireParam(req, 'id'), user);
  res.json({ assessments: assessments.map(toAssessmentDto) });
}
