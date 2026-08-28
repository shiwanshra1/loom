import { Schema, model, type Types } from 'mongoose';

export interface SpeakerProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  topics: string[];
  bio?: string;
  pastSessions: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const speakerProfileSchema = new Schema<SpeakerProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    topics: { type: [String], default: [] },
    bio: { type: String, trim: true },
    pastSessions: [{ type: Schema.Types.ObjectId, ref: 'Booking' }],
  },
  { timestamps: true }
);

export const SpeakerProfileModel = model<SpeakerProfileDocument>(
  'SpeakerProfile',
  speakerProfileSchema
);
