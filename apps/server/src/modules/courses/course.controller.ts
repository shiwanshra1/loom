import type { Request, Response } from 'express';
import { Role } from '@forge-loom/shared-types';
import { ApiError } from '../../utils/ApiError.js';
import {
  createCourseSchema,
  listCoursesQuerySchema,
  updateCourseSchema,
  updateCourseStatusSchema,
} from './course.validation.js';
import * as courseService from './course.service.js';
import { toCourseDto } from './course.mapper.js';

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
  const input = createCourseSchema.parse(req.body);

  let collegeId: string | null = null;
  if (user.role === Role.CollegeAdmin) {
    if (!user.collegeId) {
      throw new ApiError(403, 'This account is not associated with a college');
    }
    collegeId = user.collegeId;
  }

  const course = await courseService.createCourse(user.userId, collegeId, input);
  res.status(201).json({ course: toCourseDto(course) });
}

export async function update(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = updateCourseSchema.parse(req.body);
  const course = await courseService.updateCourse(user.userId, requireParam(req, 'id'), input);
  res.json({ course: toCourseDto(course) });
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const { status } = updateCourseStatusSchema.parse(req.body);
  const course = await courseService.updateCourseStatus(
    user.userId,
    requireParam(req, 'id'),
    status
  );
  res.json({ course: toCourseDto(course) });
}

// Forge Admin's cross-college drill-in (Phase 9) has no "mine" to list —
// it lists a specific college's courses instead, via ?collegeId=.
export async function listMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);

  if (user.role === Role.ForgeAdmin) {
    const collegeId = typeof req.query.collegeId === 'string' ? req.query.collegeId : undefined;
    if (!collegeId) {
      throw new ApiError(400, 'collegeId is required');
    }
    const courses = await courseService.listCollegeCourses(collegeId);
    res.json({ courses: courses.map(toCourseDto) });
    return;
  }

  const courses = await courseService.listMyCourses(user.userId);
  res.json({ courses: courses.map(toCourseDto) });
}

export async function list(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = listCoursesQuerySchema.parse(req.query);
  const page = await courseService.listPublishedCourses(query, user);
  res.json({ courses: page.courses.map(toCourseDto), nextCursor: page.nextCursor });
}

export async function listTeaching(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const courses = await courseService.listTeachingCourses(user.userId);
  res.json({ courses: courses.map(toCourseDto) });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const course = await courseService.getCourseById(requireParam(req, 'id'), user);
  res.json({ course: toCourseDto(course) });
}
