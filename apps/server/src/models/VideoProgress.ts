import { Schema, model, type Types } from 'mongoose';

export interface VideoProgressDocument {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  dayNumber: number;
  lastPositionSeconds: number;
  durationSeconds: number;
  percentWatched: number;
  completed: boolean;
  updatedAt: Date;
  createdAt: Date;
}

const videoProgressSchema = new Schema<VideoProgressDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    dayNumber: { type: Number, required: true },
    lastPositionSeconds: { type: Number, required: true, min: 0 },
    durationSeconds: { type: Number, required: true, min: 0 },
    percentWatched: { type: Number, required: true, min: 0, max: 100 },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

videoProgressSchema.index({ studentId: 1, courseId: 1, dayNumber: 1 }, { unique: true });

export const VideoProgressModel = model<VideoProgressDocument>(
  'VideoProgress',
  videoProgressSchema
);
