import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { search } from './talentPool.controller.js';

export const talentPoolRouter = Router();

talentPoolRouter.get('/', authenticate, authorize(Role.Hr), asyncHandler(search));
