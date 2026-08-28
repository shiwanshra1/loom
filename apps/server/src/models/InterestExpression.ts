import { Schema, model, type Types } from 'mongoose';

export interface InterestExpressionDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  problemStatementId: Types.ObjectId;
  createdAt: Date;
}

const interestExpressionSchema = new Schema<InterestExpressionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    problemStatementId: { type: Schema.Types.ObjectId, ref: 'ProblemStatement', required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { timestamps: false }
);

interestExpressionSchema.index({ userId: 1, problemStatementId: 1 }, { unique: true });

export const InterestExpressionModel = model<InterestExpressionDocument>(
  'InterestExpression',
  interestExpressionSchema
);
