import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { getStudentCourseProgress } from './courseProgress.service.js';
import { toCourseProgressDto } from './courseProgress.mapper.js';

export async function getCourseProgress(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  const studentId = req.params.id;
  const courseId = req.query.courseId;
  if (!studentId) {
    throw new ApiError(400, 'Missing required parameter: id');
  }
  if (typeof courseId !== 'string') {
    throw new ApiError(400, 'Missing required query parameter: courseId');
  }

  const result = await getStudentCourseProgress(studentId, courseId, req.user);
  res.json({ progress: toCourseProgressDto(result) });
}
