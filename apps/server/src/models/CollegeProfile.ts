import { Schema, model, type Types } from 'mongoose';

export interface CollegeProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  collegeName: string;
  accreditationInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const collegeProfileSchema = new Schema<CollegeProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    collegeName: { type: String, required: true, trim: true },
    accreditationInfo: { type: String, trim: true },
  },
  { timestamps: true }
);

export const CollegeProfileModel = model<CollegeProfileDocument>(
  'CollegeProfile',
  collegeProfileSchema
);
