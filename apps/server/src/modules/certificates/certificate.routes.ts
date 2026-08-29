import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listMine, verify } from './certificate.controller.js';

export const certificateRouter = Router();

certificateRouter.get('/mine', authenticate, authorize(Role.Student), asyncHandler(listMine));

// Public and unauthenticated by design (architecture doc §8.3) — rate-limited
// since it's the one endpoint in the app anyone on the internet can hit.
const verifyRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
certificateRouter.get('/verify/:token', verifyRateLimit, asyncHandler(verify));
