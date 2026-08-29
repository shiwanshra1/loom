import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { create, list, register } from './event.controller.js';

export const eventRouter = Router();

eventRouter.get('/', authenticate, asyncHandler(list));
eventRouter.post(
  '/',
  authenticate,
  authorize(Role.CommunityLeader, Role.CollegeAdmin),
  asyncHandler(create)
);
eventRouter.post('/:id/register', authenticate, asyncHandler(register));
