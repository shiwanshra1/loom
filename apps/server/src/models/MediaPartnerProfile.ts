import { Schema, model, type Types } from 'mongoose';

export interface MediaPartnerProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  outlet: string;
  accessLevel?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mediaPartnerProfileSchema = new Schema<MediaPartnerProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    outlet: { type: String, required: true, trim: true },
    accessLevel: { type: String, trim: true },
  },
  { timestamps: true }
);

export const MediaPartnerProfileModel = model<MediaPartnerProfileDocument>(
  'MediaPartnerProfile',
  mediaPartnerProfileSchema
);
