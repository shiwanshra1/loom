import type { HydratedDocument } from 'mongoose';
import { UserModel, type UserDocument } from '../../models/User.js';
import { CollegeModel } from '../../models/College.js';
import { StudentProfileModel } from '../../models/StudentProfile.js';
import { InvestorAccessGrantModel } from '../../models/InvestorAccessGrant.js';
import { ApiError } from '../../utils/ApiError.js';
import type { UpdateUserStatusInput } from './admin.validation.js';

export interface NationalStats {
  totalColleges: number;
  totalStudents: number;
  venturesLaunched: number;
  // No Placement data exists yet (schema-stub only, per milestone-1.md Phase
  // 10's own scope) — there is no real before/after employment signal to
  // compute a lift from, so this stays null rather than a fabricated number.
  employabilityLiftPercent: null;
}

export async function getNationalStats(): Promise<NationalStats> {
  const [totalColleges, totalStudents, venturesLaunched] = await Promise.all([
    CollegeModel.countDocuments(),
    StudentProfileModel.countDocuments(),
    InvestorAccessGrantModel.countDocuments(),
  ]);

  return { totalColleges, totalStudents, venturesLaunched, employabilityLiftPercent: null };
}

export interface UserRow {
  user: UserDocument;
  collegeName: string | null;
}

export async function listUsers(): Promise<UserRow[]> {
  const users = await UserModel.find().sort({ createdAt: -1 });
  const collegeIds = [...new Set(users.map((u) => u.collegeId?.toString()).filter(Boolean))];
  const colleges = await CollegeModel.find({ _id: { $in: collegeIds } });
  const nameByCollegeId = new Map(colleges.map((c) => [c._id.toString(), c.name]));

  return users.map((user) => ({
    user,
    collegeName: user.collegeId ? (nameByCollegeId.get(user.collegeId.toString()) ?? null) : null,
  }));
}

export async function updateUserStatus(
  userId: string,
  input: UpdateUserStatusInput
): Promise<HydratedDocument<UserDocument>> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  user.status = input.status;
  await user.save();
  return user;
}
