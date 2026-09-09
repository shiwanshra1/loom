import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  createMentor,
  createStudent,
  createTrainer,
  listStudents,
  updateStudentBatch,
} from './roster.controller.js';

export const rosterRouter = Router();

rosterRouter.post(
  '/students',
  authenticate,
  authorize(Role.CollegeAdmin),
  asyncHandler(createStudent)
);
rosterRouter.get('/students', authenticate, authorize(Role.CollegeAdmin), asyncHandler(listStudents));
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
