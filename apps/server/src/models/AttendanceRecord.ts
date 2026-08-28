import { Schema, model, type Types } from 'mongoose';
import type { AttendanceStatus } from '@forge-loom/shared-types';

export type { AttendanceStatus };

export interface AttendanceRecordDocument {
  _id: Types.ObjectId;
  sessionId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: AttendanceStatus;
  markedAt: Date;
  markedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRecordSchema = new Schema<AttendanceRecordDocument>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'CourseSession', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['present', 'absent', 'excused'], required: true },
    markedAt: { type: Date, default: () => new Date() },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// One record per student per session (re-marking updates the existing row).
attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
// A student's own attendance history, newest first.
attendanceRecordSchema.index({ studentId: 1, markedAt: -1 });

export const AttendanceRecordModel = model<AttendanceRecordDocument>(
  'AttendanceRecord',
  attendanceRecordSchema
);
