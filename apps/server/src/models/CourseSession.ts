import { Schema, model, type Types } from 'mongoose';
import type { CourseSessionMode, CourseSessionStatus } from '@forge-loom/shared-types';

export type { CourseSessionMode, CourseSessionStatus };

export interface CourseSessionDocument {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  dayNumber: number;
  scheduledDate: Date;
  mode: CourseSessionMode;
  status: CourseSessionStatus;
  cancelReason: string | null;
  trainerId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const courseSessionSchema = new Schema<CourseSessionDocument>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    dayNumber: { type: Number, required: true },
    scheduledDate: { type: Date, required: true },
    mode: { type: String, enum: ['offline', 'live_online', 'self_paced'], required: true },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    cancelReason: { type: String, default: null },
    trainerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// One session per course per syllabus day — sessions are materialized once,
// idempotently, so this also guards against double-generation.
courseSessionSchema.index({ courseId: 1, dayNumber: 1 }, { unique: true });

export const CourseSessionModel = model<CourseSessionDocument>(
  'CourseSession',
  courseSessionSchema
);
