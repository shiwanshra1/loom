import { Schema, model, type Types } from 'mongoose';

export interface MemberProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}

const memberProfileSchema = new Schema<MemberProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    interests: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const MemberProfileModel = model<MemberProfileDocument>('MemberProfile', memberProfileSchema);
