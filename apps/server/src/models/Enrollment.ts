import { Schema, model, type Types } from 'mongoose';
import type { EnrollmentStatus } from '@forge-loom/shared-types';

export type { EnrollmentStatus };

export interface EnrollmentDocument {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  courseId: Types.ObjectId;
  status: EnrollmentStatus;
  // Set as soon as a Razorpay order is created for this enrollment (even
  // while still pending_payment) — needed to verify the signature the
  // client hands back, and to detect a stale/mismatched order on retry.
  razorpayOrderId: string | null;
  paymentRef: string | null;
  paymentAmount: number;
  enrolledAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<EnrollmentDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    status: {
      type: String,
      enum: ['pending_payment', 'active', 'completed', 'refunded'],
      default: 'pending_payment',
    },
    razorpayOrderId: { type: String, default: null },
    paymentRef: { type: String, default: null },
    paymentAmount: { type: Number, required: true, min: 0 },
    enrolledAt: { type: Date, default: () => new Date() },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// GET /enrollments/mine's access pattern: a student's own enrollments, newest first.
enrollmentSchema.index({ studentId: 1, createdAt: -1 });

export const EnrollmentModel = model<EnrollmentDocument>('Enrollment', enrollmentSchema);
