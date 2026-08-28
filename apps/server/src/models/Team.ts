import { Schema, model, type Types } from 'mongoose';

export interface TeamDocument {
  _id: Types.ObjectId;
  name: string;
  collegeId: Types.ObjectId;
  memberStudentIds: Types.ObjectId[];
  mentorId: Types.ObjectId | null;
  trainerId: Types.ObjectId | null;
  // Phase 7 (Citadel) fills this in — always null until then.
  problemStatementId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<TeamDocument>(
  {
    name: { type: String, required: true, trim: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    memberStudentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    mentorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    trainerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    problemStatementId: { type: Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

export const TeamModel = model<TeamDocument>('Team', teamSchema);
