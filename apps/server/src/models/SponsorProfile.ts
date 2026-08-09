import { Schema, model, type Types } from 'mongoose';

export interface SponsorProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  orgName: string;
  sponsorshipTier?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sponsorProfileSchema = new Schema<SponsorProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    orgName: { type: String, required: true, trim: true },
    sponsorshipTier: { type: String, trim: true },
  },
  { timestamps: true }
);

export const SponsorProfileModel = model<SponsorProfileDocument>('SponsorProfile', sponsorProfileSchema);
