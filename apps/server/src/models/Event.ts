import { Schema, model, type Types } from 'mongoose';
import type { EventType } from '@forge-loom/shared-types';

export type { EventType };

export interface EventDocument {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  type: EventType;
  hostedBy: Types.ObjectId;
  collegeId: Types.ObjectId | null;
  venue?: string;
  scheduledAt: Date;
  agenda: string[];
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<EventDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: { type: String, enum: ['hackathon', 'seminar', 'workshop', 'other'], required: true },
    hostedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', default: null },
    venue: { type: String, trim: true },
    scheduledAt: { type: Date, required: true },
    agenda: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

eventSchema.index({ scheduledAt: 1 });

export const EventModel = model<EventDocument>('Event', eventSchema);
