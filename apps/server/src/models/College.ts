import { Schema, model, type Types } from 'mongoose';
import type { CollegePartnerTier } from '@forge-loom/shared-types';

export type { CollegePartnerTier };

export interface CollegeDocument {
  _id: Types.ObjectId;
  name: string;
  location?: string;
  partnerTier: CollegePartnerTier;
  createdAt: Date;
  updatedAt: Date;
}

const collegeSchema = new Schema<CollegeDocument>(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    partnerTier: { type: String, enum: ['bronze', 'silver', 'gold'], default: 'bronze' },
  },
  { timestamps: true }
);

export const CollegeModel = model<CollegeDocument>('College', collegeSchema);
