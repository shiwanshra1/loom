import { Schema, model, type Types } from 'mongoose';

// Events(20%)/Team(10%) stay real-but-currently-unpopulated categories — no
// `events` collection exists until Phase 9, and no distinct team-collaboration
// signal exists yet beyond what Project already captures. The formula and
// infra are real; those two categories will start contributing once their
// upstream data exists, disclosed rather than faked.
export type ScoreCategory = 'events' | 'project' | 'mentor' | 'team';

export interface ScoreEventDocument {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  category: ScoreCategory;
  points: number;
  reason: string;
  // The originating document (e.g. a sprint id) — full audit trail per the
  // architecture doc: "why does this student have this score? replay the events."
  sourceRef?: string;
  createdAt: Date;
}

const scoreEventSchema = new Schema<ScoreEventDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, enum: ['events', 'project', 'mentor', 'team'], required: true },
    points: { type: Number, required: true },
    reason: { type: String, required: true },
    sourceRef: { type: String },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

// Append-only — never updated or deleted, only recomputed from.
scoreEventSchema.index({ studentId: 1, category: 1 });

export const ScoreEventModel = model<ScoreEventDocument>('ScoreEvent', scoreEventSchema);
