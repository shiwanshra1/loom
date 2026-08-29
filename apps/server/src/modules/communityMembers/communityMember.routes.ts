import { Router } from 'express';
import { Role } from '@forge-loom/shared-types';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { invite, list } from './communityMember.controller.js';

export const communityMemberRouter = Router();

communityMemberRouter.get('/', authenticate, authorize(Role.CommunityLeader), asyncHandler(list));
communityMemberRouter.post(
  '/',
  authenticate,
  authorize(Role.CommunityLeader),
  asyncHandler(invite)
);
