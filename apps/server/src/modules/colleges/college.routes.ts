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
collegeRouter.get(
  '/mine/programs',
  authenticate,
  authorize(Role.CollegeAdmin),
  asyncHandler(myPrograms)
);
collegeRouter.get(
  '/mine/faculty',
  authenticate,
  authorize(Role.CollegeAdmin),
  asyncHandler(myFaculty)
);
