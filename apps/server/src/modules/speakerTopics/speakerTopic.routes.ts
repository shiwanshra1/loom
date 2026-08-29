import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { create, listMine } from './speakerTopic.controller.js';

export const speakerTopicRouter = Router();

speakerTopicRouter.get('/mine', authenticate, asyncHandler(listMine));
speakerTopicRouter.post('/', authenticate, asyncHandler(create));
