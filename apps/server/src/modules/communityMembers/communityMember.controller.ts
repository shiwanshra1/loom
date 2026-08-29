import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { inviteCommunityMemberSchema } from './communityMember.validation.js';
import * as communityMemberService from './communityMember.service.js';
import { toCommunityMemberDto } from './communityMember.mapper.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
}

export async function invite(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = inviteCommunityMemberSchema.parse(req.body);
  await communityMemberService.addMember(user.userId, input);
  const rows = await communityMemberService.listMembers(user.userId);
  res.status(201).json({ members: rows.map(toCommunityMemberDto) });
}

export async function list(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const rows = await communityMemberService.listMembers(user.userId);
  res.json({ members: rows.map(toCommunityMemberDto) });
}
