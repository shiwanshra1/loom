import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { create, listMine, decide } from './accessRequest.controller.js';

export const accessRequestRouter = Router();

accessRequestRouter.get('/mine', authenticate, asyncHandler(listMine));
accessRequestRouter.post('/events/:eventId', authenticate, asyncHandler(create));
accessRequestRouter.post('/:id/decide', authenticate, asyncHandler(decide));
