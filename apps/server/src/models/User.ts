import { Schema, model, type Types } from 'mongoose';
import { Role, type UserStatus } from '@forge-loom/shared-types';

export interface UserDocument {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  collegeId?: Types.ObjectId;
  mfaEnabled: boolean;
  refreshTokenVersion: number;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'pending_verification', 'suspended'],
      default: 'active',
    },
    // References the `colleges` collection introduced in Phase 2 — Mongoose refs
    // don't require the target model to exist yet, only at populate() time.
    collegeId: { type: Schema.Types.ObjectId, ref: 'College' },
    mfaEnabled: { type: Boolean, default: false },
    refreshTokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>('User', userSchema);
