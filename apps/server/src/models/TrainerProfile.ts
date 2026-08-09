import { Schema, model, type Types } from 'mongoose';

export interface TrainerProfileDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  collegeId?: Types.ObjectId;
  expertise: string[];
  assignedTeams: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const trainerProfileSchema = new Schema<TrainerProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', index: true },
    expertise: { type: [String], default: [] },
    assignedTeams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
  },
  { timestamps: true }
);

export const TrainerProfileModel = model<TrainerProfileDocument>('TrainerProfile', trainerProfileSchema);
