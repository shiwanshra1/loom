import { Role } from '@forge-loom/shared-types';
import { connectDb, disconnectDb } from '../config/db.js';
import { UserModel } from '../models/User.js';
import { hashPassword } from '../utils/password.js';
import { createProfileForRole } from '../modules/auth/profileFactory.js';

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
  { email: 'student1@forgeloom.dev', displayName: 'Student One', role: Role.Student },
  { email: 'mentor1@forgeloom.dev', displayName: 'Mentor One', role: Role.Mentor },
  { email: 'trainer1@forgeloom.dev', displayName: 'Trainer One', role: Role.Trainer },
  { email: 'speaker1@forgeloom.dev', displayName: 'Speaker One', role: Role.Speaker },
  { email: 'hr1@forgeloom.dev', displayName: 'Test HR Co', role: Role.Hr },
  { email: 'sponsor1@forgeloom.dev', displayName: 'Test Sponsor Org', role: Role.Sponsor },
  { email: 'college1@forgeloom.dev', displayName: 'Test College', role: Role.CollegeAdmin },
  { email: 'community1@forgeloom.dev', displayName: 'Test Community', role: Role.CommunityLeader },
  { email: 'media1@forgeloom.dev', displayName: 'Test Media Outlet', role: Role.MediaPartner },
  { email: 'member1@forgeloom.dev', displayName: 'Member One', role: Role.Member },
  // forge_admin and course_admin are intentionally excluded from the public
  // /register endpoint — this script is the sanctioned "seeded manually" path.
  { email: 'admin1@forgeloom.dev', displayName: 'Forge Admin', role: Role.ForgeAdmin },
  { email: 'course_admin1@forgeloom.dev', displayName: 'Course Admin One', role: Role.CourseAdmin },
];

async function seed(): Promise<void> {
  await connectDb();

  for (const account of SEED_ACCOUNTS) {
    const existing = await UserModel.findOne({ email: account.email });
    if (existing) {
      console.log(`skip   ${account.email} (already exists)`);
      continue;
    }

    const passwordHash = await hashPassword(SEED_PASSWORD);
    const user = await UserModel.create({
      email: account.email,
      passwordHash,
      role: account.role,
    });

    await createProfileForRole(account.role, user._id, account.displayName);
    console.log(`create ${account.email} (${account.role})`);
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
