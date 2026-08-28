import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { bookmark, create, interest, list } from './problemStatement.controller.js';

export const problemStatementRouter = Router();

problemStatementRouter.get('/', authenticate, asyncHandler(list));
problemStatementRouter.post(
  '/',
  authenticate,
  authorize(Role.ForgeAdmin, Role.Hr),
  asyncHandler(create)
);
problemStatementRouter.post(
  '/:id/interest',
  authenticate,
  authorize(Role.Student),
  asyncHandler(interest)
);
problemStatementRouter.post(
  '/:id/bookmark',
  authenticate,
  authorize(Role.Student),
  asyncHandler(bookmark)
);
