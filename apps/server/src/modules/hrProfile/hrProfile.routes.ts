import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getMine, updateMine, directory } from './hrProfile.controller.js';

export const hrProfileRouter = Router();

hrProfileRouter.get('/mine', authenticate, authorize(Role.Hr), asyncHandler(getMine));
hrProfileRouter.patch('/mine', authenticate, authorize(Role.Hr), asyncHandler(updateMine));
hrProfileRouter.get('/directory', authenticate, asyncHandler(directory));
