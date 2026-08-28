import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { createEnrollmentSchema } from './enrollment.validation.js';
import * as enrollmentService from './enrollment.service.js';
import { toEnrollmentDto } from './enrollment.mapper.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const { courseId } = createEnrollmentSchema.parse(req.body);
  const { enrollment, course } = await enrollmentService.createEnrollment(user.userId, courseId);
  res.status(201).json({ enrollment: toEnrollmentDto(enrollment, course) });
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const rows = await enrollmentService.listMyEnrollments(user.userId);
  res.json({
    enrollments: rows.map(({ enrollment, course }) => toEnrollmentDto(enrollment, course)),
  });
}
