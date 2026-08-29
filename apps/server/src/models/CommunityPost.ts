import { Schema, model, type Types } from 'mongoose';

export interface CommunityPostDocument {
  _id: Types.ObjectId;
  authorId: Types.ObjectId;
  content: string;
  createdAt: Date;
}

const communityPostSchema = new Schema<CommunityPostDocument>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

communityPostSchema.index({ createdAt: -1 });

export const CommunityPostModel = model<CommunityPostDocument>(
  'CommunityPost',
  communityPostSchema
);
