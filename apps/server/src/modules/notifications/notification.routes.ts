import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { listMine, markAllRead, markRead } from './notification.controller.js';

export const notificationRouter = Router();

notificationRouter.get('/mine', authenticate, asyncHandler(listMine));
notificationRouter.patch('/:id/read', authenticate, asyncHandler(markRead));
notificationRouter.post('/read-all', authenticate, asyncHandler(markAllRead));
