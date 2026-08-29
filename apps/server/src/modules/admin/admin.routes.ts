import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getAnalytics, listUsers, nationalStats, updateUserStatus } from './admin.controller.js';

export const adminRouter = Router();

adminRouter.get(
  '/national-stats',
  authenticate,
  authorize(Role.ForgeAdmin),
  asyncHandler(nationalStats)
);
adminRouter.get('/analytics', authenticate, authorize(Role.ForgeAdmin), asyncHandler(getAnalytics));
adminRouter.get('/users', authenticate, authorize(Role.ForgeAdmin), asyncHandler(listUsers));
adminRouter.patch(
  '/users/:id/status',
  authenticate,
  authorize(Role.ForgeAdmin),
  asyncHandler(updateUserStatus)
);
