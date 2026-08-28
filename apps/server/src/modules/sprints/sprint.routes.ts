import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  addFeedback,
  complete,
  getMySprints,
  replaceTasks,
  submitMilestone,
} from './sprint.controller.js';

export const sprintRouter = Router();

sprintRouter.get('/mine', authenticate, asyncHandler(getMySprints));
sprintRouter.put('/:id/tasks', authenticate, asyncHandler(replaceTasks));
sprintRouter.post('/:id/submissions', authenticate, asyncHandler(submitMilestone));
sprintRouter.post('/:id/feedback', authenticate, asyncHandler(addFeedback));
sprintRouter.patch('/:id/complete', authenticate, asyncHandler(complete));
