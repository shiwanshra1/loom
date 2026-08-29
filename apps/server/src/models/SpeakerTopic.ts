import { Schema, model, type Types } from 'mongoose';
import type { SpeakerTopicStatus } from '@forge-loom/shared-types';

export type { SpeakerTopicStatus };

export interface SpeakerTopicDocument {
  _id: Types.ObjectId;
  speakerId: Types.ObjectId;
  title: string;
  description?: string;
  status: SpeakerTopicStatus;
  scheduledAt: Date | null;
  venue: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const speakerTopicSchema = new Schema<SpeakerTopicDocument>(
  {
    speakerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ['proposed', 'booked'], default: 'proposed' },
    scheduledAt: { type: Date, default: null },
    venue: { type: String, default: null },
  },
  { timestamps: true }
);

export const SpeakerTopicModel = model<SpeakerTopicDocument>('SpeakerTopic', speakerTopicSchema);
