import type { Request, Response } from 'express';
import { ApiError } from '../../utils/ApiError.js';
import { createPostSchema } from './community.validation.js';
import * as communityService from './community.service.js';
import { toCommunityPostDto } from './community.mapper.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return req.user;
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = createPostSchema.parse(req.body);
  const post = await communityService.createPost(user.userId, input.content);
  res.status(201).json({ post: await toCommunityPostDto(post) });
}

export async function feed(_req: Request, res: Response): Promise<void> {
  const posts = await communityService.listFeed();
  res.json({ posts: await Promise.all(posts.map(toCommunityPostDto)) });
}
