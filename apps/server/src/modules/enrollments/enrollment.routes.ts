import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { create, listMine, verifyPayment } from './enrollment.controller.js';
import { issue as issueCertificate } from '../certificates/certificate.controller.js';

export const enrollmentRouter = Router();

enrollmentRouter.post('/', authenticate, authorize(Role.Student), asyncHandler(create));
enrollmentRouter.get('/mine', authenticate, authorize(Role.Student), asyncHandler(listMine));
enrollmentRouter.post(
  '/:id/verify-payment',
  authenticate,
  authorize(Role.Student),
  asyncHandler(verifyPayment)
);
// Course Admin or the assigned Trainer issue certificates — ownership is
// enforced inside the service, same as the assessment-creation pattern.
enrollmentRouter.post(
  '/:id/certificate',
  authenticate,
  authorize(Role.CourseAdmin, Role.Trainer),
  asyncHandler(issueCertificate)
);
