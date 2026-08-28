import type { Types } from 'mongoose';
import { Role } from '@forge-loom/shared-types';
import { connectDb, disconnectDb } from '../config/db.js';
import { UserModel } from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { createProfileForRole } from '../modules/auth/profileFactory.js';
import { resolveCollegeIdForRegistration } from '../modules/auth/collegeProvisioning.js';

interface SeedAccount {
  email: string;
  displayName: string;
  role: Role;
}

// Dev-only fixtures: one account per role for manually testing the app without
// filling out the register form 11 times. Re-running this script is safe —
// existing emails are skipped, not duplicated.
const SEED_PASSWORD = 'test1234';

const SEED_ACCOUNTS: SeedAccount[] = [
  { email: 'speaker1@forgeloom.dev', displayName: 'Speaker One', role: Role.Speaker },
  { email: 'hr1@forgeloom.dev', displayName: 'Test HR Co', role: Role.Hr },
  { email: 'sponsor1@forgeloom.dev', displayName: 'Test Sponsor Org', role: Role.Sponsor },
  { email: 'community1@forgeloom.dev', displayName: 'Test Community', role: Role.CommunityLeader },
  { email: 'media1@forgeloom.dev', displayName: 'Test Media Outlet', role: Role.MediaPartner },
  { email: 'member1@forgeloom.dev', displayName: 'Member One', role: Role.Member },
  // forge_admin and course_admin are intentionally excluded from the public
  // /register endpoint — this script is the sanctioned "seeded manually" path.
  { email: 'admin1@forgeloom.dev', displayName: 'Forge Admin', role: Role.ForgeAdmin },
  { email: 'course_admin1@forgeloom.dev', displayName: 'Course Admin One', role: Role.CourseAdmin },
];

// Two separate colleges, each with its own admin/student/mentor/trainer —
// deliberately two, not one, so Phase 6's college-scoping can be smoke-tested
// (college2's people must never show up in college1's admin/trainer views).
interface CollegeCluster {
  collegeAdmin: SeedAccount;
  student: SeedAccount;
  mentor: SeedAccount;
  trainer: SeedAccount;
}

const COLLEGE_CLUSTERS: CollegeCluster[] = [
  {
    collegeAdmin: {
      email: 'college1@forgeloom.dev',
      displayName: 'Forge Institute of Technology',
      role: Role.CollegeAdmin,
    },
    student: { email: 'student1@forgeloom.dev', displayName: 'Student One', role: Role.Student },
    mentor: { email: 'mentor1@forgeloom.dev', displayName: 'Mentor One', role: Role.Mentor },
    trainer: { email: 'trainer1@forgeloom.dev', displayName: 'Trainer One', role: Role.Trainer },
  },
  {
    collegeAdmin: {
      email: 'college2@forgeloom.dev',
      displayName: 'Riverside College of Engineering',
      role: Role.CollegeAdmin,
    },
    student: { email: 'student2@forgeloom.dev', displayName: 'Student Two', role: Role.Student },
    mentor: { email: 'mentor2@forgeloom.dev', displayName: 'Mentor Two', role: Role.Mentor },
    trainer: { email: 'trainer2@forgeloom.dev', displayName: 'Trainer Two', role: Role.Trainer },
  },
];

async function seedPlainAccount(account: SeedAccount): Promise<void> {
  const existing = await UserModel.findOne({ email: account.email });
  if (existing) {
    console.log(`skip   ${account.email} (already exists)`);
    return;
  }

  const passwordHash = await hashPassword(SEED_PASSWORD);
  const user = await UserModel.create({ email: account.email, passwordHash, role: account.role });
  await createProfileForRole(account.role, user._id, account.displayName);
  console.log(`create ${account.email} (${account.role})`);
}

async function seedCollegeAdmin(account: SeedAccount): Promise<Types.ObjectId> {
  const existing = await UserModel.findOne({ email: account.email });
  if (existing) {
    console.log(`skip   ${account.email} (already exists)`);
    if (!existing.collegeId) {
      throw new Error(`${account.email} exists but has no collegeId — inconsistent seed state`);
    }
    return existing.collegeId;
  }

  const collegeId = await resolveCollegeIdForRegistration(account.role, account.displayName);
  if (!collegeId) {
    throw new Error('College provisioning did not return a collegeId for a college_admin seed');
  }

  const passwordHash = await hashPassword(SEED_PASSWORD);
  const user = await UserModel.create({
    email: account.email,
    passwordHash,
    role: account.role,
    collegeId,
  });
  await createProfileForRole(account.role, user._id, account.displayName, collegeId);
  console.log(`create ${account.email} (${account.role}, founded a new College)`);
  return collegeId;
}

async function seedCollegeScopedAccount(
  account: SeedAccount,
  collegeId: Types.ObjectId
): Promise<void> {
  const existing = await UserModel.findOne({ email: account.email });
  if (existing) {
    console.log(`skip   ${account.email} (already exists)`);
    return;
  }

  const passwordHash = await hashPassword(SEED_PASSWORD);
  const user = await UserModel.create({
    email: account.email,
    passwordHash,
    role: account.role,
    collegeId,
  });
  await createProfileForRole(account.role, user._id, account.displayName, collegeId);
  console.log(`create ${account.email} (${account.role})`);
}

async function seed(): Promise<void> {
  await connectDb();

  for (const account of SEED_ACCOUNTS) {
    await seedPlainAccount(account);
  }

  for (const cluster of COLLEGE_CLUSTERS) {
    const collegeId = await seedCollegeAdmin(cluster.collegeAdmin);
    await seedCollegeScopedAccount(cluster.student, collegeId);
    await seedCollegeScopedAccount(cluster.mentor, collegeId);
    await seedCollegeScopedAccount(cluster.trainer, collegeId);
  }

  console.log(`\nAll seed accounts use the password: ${SEED_PASSWORD}`);
  await disconnectDb();
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exit(1);
  });
