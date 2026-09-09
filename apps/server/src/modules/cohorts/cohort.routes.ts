import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { scopeToCollege } from '../../middleware/scopeToCollege.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { advancePhase, create, list } from './cohort.controller.js';

export const cohortRouter = Router();

// College Admin can create batches for their own college (Forge Admin
// hierarchy Phase 6) — the controller forces collegeId from their session,
// ignoring anything they send in the body.
cohortRouter.post(
  '/',
  authenticate,
  authorize(Role.ForgeAdmin, Role.CollegeAdmin),
  asyncHandler(create)
);
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
