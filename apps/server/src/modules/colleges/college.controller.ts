import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { createCollegeSchema } from './college.validation.js';
import * as collegeService from './college.service.js';
import { toCollegeDto, toPartnerCollegeDto } from './college.mapper.js';

function requireOwnCollegeId(req: Request): string {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  if (!req.user.collegeId) {
    throw new ApiError(403, 'This account is not associated with a college');
  }
  return req.user.collegeId;
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = createCollegeSchema.parse(req.body);
  const college = await collegeService.createCollege(input);
  res.status(201).json({ college: toCollegeDto(college) });
}

export async function list(_req: Request, res: Response): Promise<void> {
  const colleges = await collegeService.listColleges();
  res.json({ colleges: colleges.map(toCollegeDto) });
}

export async function myPrograms(req: Request, res: Response): Promise<void> {
  const collegeId = requireOwnCollegeId(req);
  const programs = await collegeService.getCollegePrograms(collegeId);
  res.json({ programs });
}

export async function myFaculty(req: Request, res: Response): Promise<void> {
  const collegeId = requireOwnCollegeId(req);
  const faculty = await collegeService.getCollegeFaculty(collegeId);
  res.json({ faculty });
}

export async function partners(_req: Request, res: Response): Promise<void> {
  const rows = await collegeService.listPartnerColleges();
  res.json({ colleges: rows.map(toPartnerCollegeDto) });
}
