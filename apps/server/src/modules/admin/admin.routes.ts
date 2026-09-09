import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { adminList as listCollegesForAdmin } from '../colleges/college.controller.js';
import {
  createForgeAdmin,
  getAnalytics,
  listForgeAdmins,
  listUsers,
  nationalStats,
  updateUserStatus,
} from './admin.controller.js';

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
adminRouter.post(
  '/forge-admins',
  authenticate,
  authorize(Role.ForgeAdmin),
  asyncHandler(createForgeAdmin)
);
adminRouter.get(
  '/forge-admins',
  authenticate,
  authorize(Role.ForgeAdmin),
  asyncHandler(listForgeAdmins)
);
adminRouter.get(
  '/colleges',
  authenticate,
  authorize(Role.ForgeAdmin),
  asyncHandler(listCollegesForAdmin)
);
