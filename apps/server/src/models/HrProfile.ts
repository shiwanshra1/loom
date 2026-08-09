import { Schema, model, type Types } from 'mongoose';

export interface HrProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  companyName: string;
  industry?: string;
  companyDetails?: string;
  createdAt: Date;
  updatedAt: Date;
}

const hrProfileSchema = new Schema<HrProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, required: true, trim: true },
    industry: { type: String, trim: true },
    companyDetails: { type: String, trim: true },
  },
  { timestamps: true }
);

export const HrProfileModel = model<HrProfileDocument>('HrProfile', hrProfileSchema);
