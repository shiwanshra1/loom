import { Schema, model, type Types } from 'mongoose';

export type CommunityMemberRole = 'lead' | 'volunteer' | 'public';

export interface CommunityMemberEntry {
  userId: Types.ObjectId;
  role: CommunityMemberRole;
}

export interface CommunityLeaderProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  orgName: string;
  volunteerNetwork: Types.ObjectId[];
  members: CommunityMemberEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const communityLeaderProfileSchema = new Schema<CommunityLeaderProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    orgName: { type: String, required: true, trim: true },
    volunteerNetwork: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [
      {
        _id: false,
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['lead', 'volunteer', 'public'], default: 'public' },
      },
    ],
  },
  { timestamps: true }
);

export const CommunityLeaderProfileModel = model<CommunityLeaderProfileDocument>(
  'CommunityLeaderProfile',
  communityLeaderProfileSchema
);
