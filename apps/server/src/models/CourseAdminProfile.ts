import { Schema, model, type Types } from 'mongoose';

export interface CourseAdminProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

const courseAdminProfileSchema = new Schema<CourseAdminProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
  },
  { timestamps: true }
);

export const CourseAdminProfileModel = model<CourseAdminProfileDocument>(
  'CourseAdminProfile',
  courseAdminProfileSchema
);
