import { Schema, model, type Types } from 'mongoose';

export interface MilestoneFeedback {
  mentorId: Types.ObjectId;
  comment: string;
  rating?: number;
  createdAt: Date;
}

export interface MilestoneSubmissionDocument {
  _id: Types.ObjectId;
  sprintId: Types.ObjectId;
  teamId: Types.ObjectId;
  artifactUrls: string[];
  demoDate: Date | null;
  mentorFeedback: MilestoneFeedback[];
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<MilestoneFeedback>(
  {
    mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const milestoneSubmissionSchema = new Schema<MilestoneSubmissionDocument>(
  {
    sprintId: { type: Schema.Types.ObjectId, ref: 'Sprint', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    artifactUrls: { type: [String], default: [] },
    demoDate: { type: Date, default: null },
    mentorFeedback: { type: [feedbackSchema], default: [] },
  },
  { timestamps: true }
);

// Versioned, not overwritten — a new submission for the same sprint is a new
// document, so submission history is never lost.
milestoneSubmissionSchema.index({ sprintId: 1, createdAt: -1 });

export const MilestoneSubmissionModel = model<MilestoneSubmissionDocument>(
  'MilestoneSubmission',
  milestoneSubmissionSchema
);
