import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { create, listMine, update } from './booking.controller.js';

export const bookingRouter = Router();

bookingRouter.post('/', authenticate, authorize(Role.Student, Role.Mentor), asyncHandler(create));
bookingRouter.get(
  '/mine',
  authenticate,
  authorize(Role.Student, Role.Mentor),
  asyncHandler(listMine)
);
bookingRouter.patch(
  '/:id',
  authenticate,
  authorize(Role.Student, Role.Mentor),
  asyncHandler(update)
);
