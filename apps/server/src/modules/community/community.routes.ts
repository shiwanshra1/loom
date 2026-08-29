import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { create, feed } from './community.controller.js';

export const communityRouter = Router();

communityRouter.get('/feed', authenticate, asyncHandler(feed));
communityRouter.post('/posts', authenticate, asyncHandler(create));
