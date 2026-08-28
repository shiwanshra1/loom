import { Schema, model, type Types } from 'mongoose';

export interface CollegeProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  // The College entity this admin founded at registration (Phase 6) — see
  // collegeProvisioning.ts. Duplicates User.collegeId, which is what
  // scopeToCollege actually reads; kept here too so this profile document is
  // self-describing rather than pointing at nothing.
  collegeId: Types.ObjectId;
  collegeName: string;
  accreditationInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const collegeProfileSchema = new Schema<CollegeProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true },
    collegeName: { type: String, required: true, trim: true },
    accreditationInfo: { type: String, trim: true },
  },
  { timestamps: true }
);

export const CollegeProfileModel = model<CollegeProfileDocument>(
  'CollegeProfile',
  collegeProfileSchema
);
