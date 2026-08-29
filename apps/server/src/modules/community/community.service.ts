import { CommunityPostModel, type CommunityPostDocument } from '../../models/CommunityPost.js';

export async function createPost(
  authorId: string,
  content: string
): Promise<CommunityPostDocument> {
  return CommunityPostModel.create({ authorId, content });
}

export async function listFeed(limit = 50): Promise<CommunityPostDocument[]> {
  return CommunityPostModel.find().sort({ createdAt: -1 }).limit(limit);
}
