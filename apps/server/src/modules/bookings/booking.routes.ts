import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { create, listMine, update } from './booking.controller.js';

export const bookingRouter = Router();

const BOOKING_ROLES = [Role.Student, Role.Mentor, Role.Sponsor, Role.CollegeAdmin];

bookingRouter.post('/', authenticate, authorize(...BOOKING_ROLES), asyncHandler(create));
bookingRouter.get('/mine', authenticate, authorize(...BOOKING_ROLES), asyncHandler(listMine));
bookingRouter.patch('/:id', authenticate, authorize(...BOOKING_ROLES), asyncHandler(update));
