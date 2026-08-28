import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { create, list, update } from './team.controller.js';
import { getTeamSprints } from '../sprints/sprint.controller.js';

export const teamRouter = Router();

teamRouter.post(
  '/',
  authenticate,
  authorize(Role.CollegeAdmin, Role.Trainer),
  asyncHandler(create)
);
teamRouter.get(
  '/',
  authenticate,
  authorize(Role.ForgeAdmin, Role.CollegeAdmin, Role.Trainer, Role.Mentor, Role.Student),
  asyncHandler(list)
);
teamRouter.get('/:id/sprints', authenticate, asyncHandler(getTeamSprints));
teamRouter.patch(
  '/:id',
  authenticate,
  authorize(Role.CollegeAdmin, Role.Trainer),
  asyncHandler(update)
);
