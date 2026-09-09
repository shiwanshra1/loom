import type { Request, Response } from 'express';
import { requireViewedCollegeId } from '../../middleware/scopeToCollege.js';
import { onboardCollegeSchema } from './college.validation.js';
import * as collegeService from './college.service.js';
import {
  toAdminCollegeSummaryDto,
  toCollegeDto,
  toOnboardCollegeResultDto,
  toPartnerCollegeDto,
} from './college.mapper.js';

export async function create(req: Request, res: Response): Promise<void> {
  const input = onboardCollegeSchema.parse(req.body);
  const result = await collegeService.onboardCollege(input);
  res.status(201).json(toOnboardCollegeResultDto(result));
}

export async function list(_req: Request, res: Response): Promise<void> {
  const colleges = await collegeService.listColleges();
  res.json({ colleges: colleges.map(toCollegeDto) });
}

export async function adminList(_req: Request, res: Response): Promise<void> {
  const rows = await collegeService.getAdminCollegeSummaries();
  res.json({ colleges: rows.map(toAdminCollegeSummaryDto) });
}

// Read-only — also serves Forge Admin's cross-college drill-in via
// ?collegeId= (Phase 9).
export async function myPrograms(req: Request, res: Response): Promise<void> {
  const collegeId = requireViewedCollegeId(req);
  const programs = await collegeService.getCollegePrograms(collegeId);
  res.json({ programs });
}

export async function myFaculty(req: Request, res: Response): Promise<void> {
  const collegeId = requireViewedCollegeId(req);
  const faculty = await collegeService.getCollegeFaculty(collegeId);
  res.json({ faculty });
}

export async function partners(_req: Request, res: Response): Promise<void> {
  const rows = await collegeService.listPartnerColleges();
  res.json({ colleges: rows.map(toPartnerCollegeDto) });
}
