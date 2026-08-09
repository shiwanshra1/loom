import { Schema, model, type Types } from 'mongoose';

export interface MentorProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  collegeId?: Types.ObjectId;
  expertise: string[];
  assignedStudents: Types.ObjectId[];
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mentorProfileSchema = new Schema<MentorProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', index: true },
    expertise: { type: [String], default: [] },
    assignedStudents: [{ type: Schema.Types.ObjectId, ref: 'StudentProfile' }],
    bio: { type: String, trim: true },
  },
  { timestamps: true }
);

export const MentorProfileModel = model<MentorProfileDocument>('MentorProfile', mentorProfileSchema);
