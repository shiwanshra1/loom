import type { CommunityPostDto } from '@forge-loom/shared-types';
import { UserModel } from '../../models/User.js';
import type { CommunityPostDocument } from '../../models/CommunityPost.js';

export async function toCommunityPostDto(post: CommunityPostDocument): Promise<CommunityPostDto> {
  const author = await UserModel.findById(post.authorId);
  return {
    id: post._id.toString(),
    authorEmail: author?.email ?? '',
    content: post.content,
    createdAt: post.createdAt.toISOString(),
  };
}
