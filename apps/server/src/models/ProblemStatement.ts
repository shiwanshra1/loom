import { Schema, model, type Types } from 'mongoose';

export type ProblemStatementSource = 'industry' | 'government' | 'internal';
export type ProblemStatementDifficulty = 'easy' | 'medium' | 'hard';
export type ProblemStatementStatus = 'open' | 'closed';

export interface ProblemStatementDeliverable {
  title: string;
  done: boolean;
}

export interface ProblemStatementDocument {
  _id: Types.ObjectId;
  title: string;
  description: string;
  overview?: string;
  source: ProblemStatementSource;
  domain: string;
  tags: string[];
  teamSize: number;
  durationWeeks: number;
  difficulty: ProblemStatementDifficulty;
  status: ProblemStatementStatus;
  featured: boolean;
  deliverables: ProblemStatementDeliverable[];
  postedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const deliverableSchema = new Schema<ProblemStatementDeliverable>(
  {
    title: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const problemStatementSchema = new Schema<ProblemStatementDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    overview: { type: String, trim: true },
    source: { type: String, enum: ['industry', 'government', 'internal'], required: true },
    domain: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    teamSize: { type: Number, required: true, min: 1 },
    durationWeeks: { type: Number, required: true, min: 1 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    featured: { type: Boolean, default: false },
    deliverables: { type: [deliverableSchema], default: [] },
    postedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const ProblemStatementModel = model<ProblemStatementDocument>(
  'ProblemStatement',
  problemStatementSchema
);
