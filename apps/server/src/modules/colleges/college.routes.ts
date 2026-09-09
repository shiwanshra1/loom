import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { create, list, myFaculty, myPrograms, partners } from './college.controller.js';

export const collegeRouter = Router();

// Public and unauthenticated on purpose — the register form needs to list
// colleges for Student/Mentor/Trainer signups before a session exists. Only
// name/location/tier are exposed, nothing sensitive.
collegeRouter.get('/', asyncHandler(list));
collegeRouter.post('/', authenticate, authorize(Role.ForgeAdmin), asyncHandler(create));
collegeRouter.get('/partners', authenticate, authorize(Role.Sponsor), asyncHandler(partners));
// Also readable by Forge Admin via ?collegeId= (Phase 9 cross-college
// drill-in) — the "mine" in the path is a holdover from College Admin's own
// usage, not a hard restriction to it.
collegeRouter.get(
  '/mine/programs',
  authenticate,
  authorize(Role.CollegeAdmin, Role.ForgeAdmin),
  asyncHandler(myPrograms)
);
collegeRouter.get(
  '/mine/faculty',
  authenticate,
  authorize(Role.CollegeAdmin, Role.ForgeAdmin),
  asyncHandler(myFaculty)
);
