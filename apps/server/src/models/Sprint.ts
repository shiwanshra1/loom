import { Schema, model, type Types } from 'mongoose';
import type { SprintStatus, SprintTaskStatus } from '@forge-loom/shared-types';

export type { SprintStatus, SprintTaskStatus };

export interface SprintTask {
  title: string;
  status: SprintTaskStatus;
  dueDate: Date;
}

export interface SprintDocument {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  cycleNumber: number;
  status: SprintStatus;
  startDate: Date;
  endDate: Date;
  tasks: SprintTask[];
  // Cached, recomputed whenever tasks change — completed tasks / total tasks.
  progressPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const sprintTaskSchema = new Schema<SprintTask>(
  {
    title: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    dueDate: { type: Date, required: true },
  },
  { _id: false }
);

const sprintSchema = new Schema<SprintDocument>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    cycleNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'submitted', 'reviewed', 'complete'],
      default: 'not_started',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    tasks: { type: [sprintTaskSchema], default: [] },
    progressPercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One sprint per cycle per team — materialized once when a team gets its
// problem statement assigned (see team.service.ts).
sprintSchema.index({ teamId: 1, cycleNumber: 1 }, { unique: true });

export const SprintModel = model<SprintDocument>('Sprint', sprintSchema);
