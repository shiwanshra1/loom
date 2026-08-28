import type { Request, Response } from 'express';
import { Role } from '@forge-loom/shared-types';
import { ApiError } from '../../utils/ApiError.js';
import { createCohortSchema, updateCohortPhaseSchema } from './cohort.validation.js';
import * as cohortService from './cohort.service.js';
import { toCohortDto } from './cohort.mapper.js';

function requireParam(req: Request, name: string): string {
  const value = req.params[name];
  if (!value) {
    throw new ApiError(400, `Missing required parameter: ${name}`);
  }
  return value;
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createCohortSchema.parse(req.body);
  const cohort = await cohortService.createCohort(input);
  res.status(201).json({ cohort: toCohortDto(cohort) });
}

export async function list(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }

  const filter =
    req.user.role === Role.ForgeAdmin && typeof req.query.collegeId === 'string'
      ? { collegeId: req.query.collegeId }
      : (req.collegeFilter ?? {});

  const cohorts = await cohortService.listCohorts(filter);
  res.json({ cohorts: cohorts.map(toCohortDto) });
}

export async function advancePhase(req: Request, res: Response): Promise<void> {
  const input = updateCohortPhaseSchema.parse(req.body);
  const cohort = await cohortService.advanceCohortPhase(requireParam(req, 'id'), input);
  res.json({ cohort: toCohortDto(cohort) });
}
