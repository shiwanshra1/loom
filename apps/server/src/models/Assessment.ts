import { Schema, model, type Types } from 'mongoose';
import type { AssessmentType } from '@forge-loom/shared-types';

export type { AssessmentType };

export interface AssessmentDocument {
  _id: Types.ObjectId;
  courseId: Types.ObjectId;
  title: string;
  type: AssessmentType;
  scheduledDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assessmentSchema = new Schema<AssessmentDocument>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: ['quiz', 'exam', 'assignment'], required: true },
    scheduledDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export const AssessmentModel = model<AssessmentDocument>('Assessment', assessmentSchema);
