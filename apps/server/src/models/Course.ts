import { Schema, model, type Types } from 'mongoose';

export type CourseDeliveryMode = 'online' | 'offline';
export type CourseStatus = 'draft' | 'published' | 'archived';

export interface SyllabusDay {
  dayNumber: number;
  title: string;
  description?: string;
  // Online-only (Phase 4): the unlisted YouTube video for this day.
  youtubeVideoId: string | null;
}

export interface CourseDocument {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  createdBy: Types.ObjectId;
  deliveryMode: CourseDeliveryMode;
  durationHours: number;
  durationDays: number;
  price: number;
  currency: string;
  status: CourseStatus;
  syllabus: SyllabusDay[];
  // The Trainer assigned to teach this course (Phase 3) — null until a
  // course_admin assigns one via `trainerEmail` on create/update.
  trainerId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// Syllabus stays embedded rather than its own collection — it's small,
// bounded (a few hundred days at most), and always read/written as a whole
// alongside its parent course (architecture doc's embedding-vs-reference
// principle from §6 applies here the same way it does to sprint tasks).
const syllabusDaySchema = new Schema<SyllabusDay>(
  {
    dayNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    youtubeVideoId: { type: String, default: null },
  },
  { _id: false }
);

const courseSchema = new Schema<CourseDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'CourseAdminProfile',
      required: true,
      index: true,
    },
    deliveryMode: { type: String, enum: ['online', 'offline'], required: true },
    durationHours: { type: Number, required: true, min: 0 },
    durationDays: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    syllabus: { type: [syllabusDaySchema], default: [] },
    trainerId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  },
  { timestamps: true }
);

// Talent/catalog listing pattern: filter published courses, newest first.
courseSchema.index({ status: 1, createdAt: -1 });

export const CourseModel = model<CourseDocument>('Course', courseSchema);
