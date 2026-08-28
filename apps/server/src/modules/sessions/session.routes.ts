import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getStudentAttendance, markAttendance, updateSession } from './session.controller.js';

export const sessionRouter = Router();

sessionRouter.patch('/:id', authenticate, authorize(Role.Trainer), asyncHandler(updateSession));
sessionRouter.post(
  '/:id/attendance',
  authenticate,
  authorize(Role.Trainer),
  asyncHandler(markAttendance)
);

// A separate router (mounted at /api/students) since this endpoint is keyed
// by student id, not session/course id, per the roadmap's own path choice.
export const studentAttendanceRouter = Router();

studentAttendanceRouter.get('/:id/attendance', authenticate, asyncHandler(getStudentAttendance));
