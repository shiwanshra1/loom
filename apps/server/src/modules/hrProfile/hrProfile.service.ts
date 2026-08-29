import type { HydratedDocument } from 'mongoose';
import { HrProfileModel, type HrProfileDocument } from '../../models/HrProfile.js';
import { UserModel } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import type { UpdateHrProfileInput } from './hrProfile.validation.js';

export async function getMyProfile(userId: string): Promise<HydratedDocument<HrProfileDocument>> {
  const profile = await HrProfileModel.findOne({ userId });
  if (!profile) {
    throw new ApiError(404, 'HR profile not found');
  }
  return profile;
}

export async function updateMyProfile(
  userId: string,
  input: UpdateHrProfileInput
): Promise<HydratedDocument<HrProfileDocument>> {
  const profile = await getMyProfile(userId);
  if (input.companyName !== undefined) profile.companyName = input.companyName;
  if (input.industry !== undefined) profile.industry = input.industry;
  if (input.companyDetails !== undefined) profile.companyDetails = input.companyDetails;
  await profile.save();
  return profile;
}

export interface HrDirectoryEntry {
  companyName: string;
  contactEmail: string;
}

export async function listDirectory(): Promise<HrDirectoryEntry[]> {
  const profiles = await HrProfileModel.find();
  const users = await UserModel.find({ _id: { $in: profiles.map((p) => p.userId) } });
  const emailByUserId = new Map(users.map((u) => [u._id.toString(), u.email]));

  return profiles.map((profile) => ({
    companyName: profile.companyName,
    contactEmail: emailByUserId.get(profile.userId.toString()) ?? '',
  }));
}
