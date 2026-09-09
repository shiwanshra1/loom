import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  bulkCreateStudents,
  createMentor,
  createStudent,
  createTrainer,
  listStudents,
  sendWelcomeEmails,
  updateStudentBatch,
} from './roster.controller.js';

export const rosterRouter = Router();

rosterRouter.post(
  '/students',
  authenticate,
  authorize(Role.CollegeAdmin),
  asyncHandler(createStudent)
);
// Read-only — also serves Forge Admin's cross-college drill-in via
// ?collegeId= (Phase 9); write endpoints below stay CollegeAdmin-only.
rosterRouter.get(
  '/students',
  authenticate,
  authorize(Role.CollegeAdmin, Role.ForgeAdmin),
  asyncHandler(listStudents)
);
rosterRouter.post(
  '/students/bulk',
  authenticate,
  authorize(Role.CollegeAdmin),
  asyncHandler(bulkCreateStudents)
);
rosterRouter.post(
  '/students/bulk/send-welcome-emails',
  authenticate,
  authorize(Role.CollegeAdmin),
  asyncHandler(sendWelcomeEmails)
);
rosterRouter.patch(
  '/students/:id/batch',
  authenticate,
  authorize(Role.CollegeAdmin),
  asyncHandler(updateStudentBatch)
);
rosterRouter.post('/mentors', authenticate, authorize(Role.CollegeAdmin), asyncHandler(createMentor));
rosterRouter.post(
  '/trainers',
  authenticate,
  authorize(Role.CollegeAdmin),
  asyncHandler(createTrainer)
);
