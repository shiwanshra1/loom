import type { CommunityPost } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export async function createPost(authorId: string, content: string): Promise<CommunityPost> {
  return prisma.communityPost.create({ data: { authorId, content } });
}

export async function listFeed(limit = 50): Promise<CommunityPost[]> {
  return prisma.communityPost.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
}
