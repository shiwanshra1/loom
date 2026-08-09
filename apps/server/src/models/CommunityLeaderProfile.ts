import { Schema, model, type Types } from 'mongoose';

export interface CommunityLeaderProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  orgName: string;
  volunteerNetwork: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const communityLeaderProfileSchema = new Schema<CommunityLeaderProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    orgName: { type: String, required: true, trim: true },
    volunteerNetwork: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const CommunityLeaderProfileModel = model<CommunityLeaderProfileDocument>(
  'CommunityLeaderProfile',
  communityLeaderProfileSchema
);
