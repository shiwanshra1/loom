import { Schema, model, type Types } from 'mongoose';

export interface InvestorAccessGrantDocument {
  _id: Types.ObjectId;
  teamId: Types.ObjectId;
  grantedAt: Date;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
}

const investorAccessGrantSchema = new Schema<InvestorAccessGrantDocument>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, unique: true },
    grantedAt: { type: Date, default: () => new Date() },
    reason: { type: String, required: true },
  },
  { timestamps: true }
);

export const InvestorAccessGrantModel = model<InvestorAccessGrantDocument>(
  'InvestorAccessGrant',
  investorAccessGrantSchema
);
