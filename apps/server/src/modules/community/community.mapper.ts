import type { CommunityPostDto } from '@forge-loom/shared-types';
import type { CommunityPost } from '@prisma/client';
import { prisma } from '../../config/prisma.js';

export async function toCommunityPostDto(post: CommunityPost): Promise<CommunityPostDto> {
  const author = await prisma.user.findUnique({ where: { id: post.authorId } });
  return {
    id: post.id,
    authorEmail: author?.email ?? '',
    content: post.content,
    createdAt: post.createdAt.toISOString(),
  };
}
