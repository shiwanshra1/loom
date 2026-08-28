import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { create, getOne, list, listMine, update, updateStatus } from './course.controller.js';

export const courseRouter = Router();

// Any authenticated role can browse/read published courses (catalog use case,
// Phase 2) — only mutation and the "mine" listing are course_admin-only.
courseRouter.get('/', authenticate, asyncHandler(list));
courseRouter.get('/mine', authenticate, authorize(Role.CourseAdmin), asyncHandler(listMine));
courseRouter.get('/:id', authenticate, asyncHandler(getOne));

courseRouter.post('/', authenticate, authorize(Role.CourseAdmin), asyncHandler(create));
courseRouter.patch('/:id', authenticate, authorize(Role.CourseAdmin), asyncHandler(update));
courseRouter.patch(
  '/:id/status',
  authenticate,
  authorize(Role.CourseAdmin),
  asyncHandler(updateStatus)
);
