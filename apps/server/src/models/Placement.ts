import { Schema, model, type Types } from 'mongoose';
import type { PlacementStatus } from '@forge-loom/shared-types';

export type { PlacementStatus };

// Schema stub only per milestone-1.md Phase 10 — gives the data model a real
// home for this part of the student journey without building the full
// HR-facing workflow (endpoints/UI) in this pass. No module/routes exist for
// this collection yet.
export interface PlacementDocument {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  companyId: Types.ObjectId;
  status: PlacementStatus;
  role: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const placementSchema = new Schema<PlacementDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'HrProfile', required: true },
    status: {
      type: String,
      enum: ['applied', 'interviewing', 'offered', 'placed'],
      default: 'applied',
    },
    role: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

export const PlacementModel = model<PlacementDocument>('Placement', placementSchema);
