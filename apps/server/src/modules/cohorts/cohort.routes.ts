import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { scopeToCollege } from '../../middleware/scopeToCollege.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { advancePhase, create, list } from './cohort.controller.js';

export const cohortRouter = Router();

// Forge-admin-managed per the roadmap; College Admin can only read their own.
cohortRouter.post('/', authenticate, authorize(Role.ForgeAdmin), asyncHandler(create));
cohortRouter.get(
  '/',
  authenticate,
  authorize(Role.ForgeAdmin, Role.CollegeAdmin),
  scopeToCollege,
  asyncHandler(list)
);
cohortRouter.patch(
  '/:id/phase',
  authenticate,
  authorize(Role.ForgeAdmin),
  asyncHandler(advancePhase)
);
