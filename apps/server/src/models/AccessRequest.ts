import { Schema, model, type Types } from 'mongoose';
import type { AccessRequestStatus } from '@forge-loom/shared-types';

export type { AccessRequestStatus };

export interface AccessRequestDocument {
  _id: Types.ObjectId;
  requesterId: Types.ObjectId;
  eventId: Types.ObjectId;
  status: AccessRequestStatus;
  requestedAt: Date;
  decidedAt: Date | null;
}

const accessRequestSchema = new Schema<AccessRequestDocument>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
    requestedAt: { type: Date, default: () => new Date() },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: false }
);

accessRequestSchema.index({ requesterId: 1, eventId: 1 }, { unique: true });

export const AccessRequestModel = model<AccessRequestDocument>(
  'AccessRequest',
  accessRequestSchema
);
