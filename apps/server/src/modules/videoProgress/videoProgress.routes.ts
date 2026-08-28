import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { list, upsert } from './videoProgress.controller.js';

export const videoProgressRouter = Router();

videoProgressRouter.post('/', authenticate, authorize(Role.Student), asyncHandler(upsert));
videoProgressRouter.get('/', authenticate, authorize(Role.Student), asyncHandler(list));
