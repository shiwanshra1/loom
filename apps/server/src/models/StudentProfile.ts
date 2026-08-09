import { Schema, model, type Types } from 'mongoose';

export interface StudentProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  collegeId?: Types.ObjectId;
  name: string;
  course?: string;
  mentorId?: Types.ObjectId;
  builderScore: number;
  skills: string[];
  domain?: string;
  linkedIn?: string;
  // Gamification — cosmetic display fields only, do not feed builderScore (see docs §12/§13).
  currentStreak: number;
  xp: number;
  streakHistory: boolean[];
  createdAt: Date;
  updatedAt: Date;
}

const studentProfileSchema = new Schema<StudentProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College' },
    name: { type: String, required: true, trim: true },
    course: { type: String, trim: true },
    mentorId: { type: Schema.Types.ObjectId, ref: 'MentorProfile' },
    builderScore: { type: Number, default: 0 },
    skills: { type: [String], default: [] },
    domain: { type: String, trim: true },
    linkedIn: { type: String, trim: true },
    currentStreak: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    streakHistory: { type: [Boolean], default: [] },
  },
  { timestamps: true }
);

// Talent Pool scoping/filter index per architecture doc §6.1.
studentProfileSchema.index({ collegeId: 1, domain: 1, builderScore: -1 });

export const StudentProfileModel = model<StudentProfileDocument>('StudentProfile', studentProfileSchema);
