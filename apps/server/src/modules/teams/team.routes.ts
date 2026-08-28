import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { create, list, update } from './team.controller.js';

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
  authorize(Role.ForgeAdmin, Role.CollegeAdmin, Role.Trainer),
  asyncHandler(list)
);
teamRouter.patch(
  '/:id',
  authenticate,
  authorize(Role.CollegeAdmin, Role.Trainer),
  asyncHandler(update)
);
