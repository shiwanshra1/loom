import { Schema, model, type Types } from 'mongoose';
import type { CohortPhase } from '@forge-loom/shared-types';

export type { CohortPhase };

export interface CohortDocument {
  _id: Types.ObjectId;
  collegeId: Types.ObjectId;
  // A human-facing label ("Cohort 4") — not in the architecture doc's schema
  // table verbatim, but needed for any usable list/management UI; disclosed.
  name: string;
  startDate: Date;
  endDate: Date;
  phase: CohortPhase;
  createdAt: Date;
  updatedAt: Date;
}

const cohortSchema = new Schema<CohortDocument>(
  {
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    phase: {
      type: String,
      enum: ['activation', 'bootcamp', 'citadel'],
      default: 'activation',
    },
  },
  { timestamps: true }
);

export const CohortModel = model<CohortDocument>('Cohort', cohortSchema);
