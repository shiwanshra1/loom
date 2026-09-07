import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';

// Runs once before the whole suite, in a separate process from the test
// files themselves (vitest's globalSetup contract) — drops the dedicated
// forgeloom_test database so every run starts from a clean slate instead of
// accumulating fixture data across runs. Never touches the real dev
// database (a different name, set in apps/server/.env.test).
export default async function setup() {
  process.env.NODE_ENV = 'test';
  const { config } = await import('dotenv');
  const path = await import('node:path');
  config({ path: path.resolve(process.cwd(), '.env.test') });

  const uri = process.env.MONGO_URI;
  if (!uri || !uri.includes('forgeloom_test')) {
    throw new Error(
      `Refusing to run tests: MONGO_URI does not point at forgeloom_test (got: ${uri})`
    );
  }

  const connection = await mongoose.createConnection(uri).asPromise();
  await connection.dropDatabase();
  await connection.close();

  await resetPostgres();
}

// Scoped truncate covering only the tables migrated so far — a deliberately
// narrow preview of Phase 7's real work, which will generalize this to every
// table by reading `information_schema.tables` instead of a hardcoded list.
// Extend this list as each further phase lands, not all at once now.
const MIGRATED_TABLES = [
  // Phase 1 — Identity/colleges
  'User',
  'StudentProfile',
  'MentorProfile',
  'TrainerProfile',
  'SpeakerProfile',
  'HrProfile',
  'SponsorProfile',
  'CollegeProfile',
  'CommunityLeaderProfile',
  'CommunityMember',
  'CommunityVolunteer',
  'MediaPartnerProfile',
  'MemberProfile',
  'CourseAdminProfile',
  'College',
  // Phase 2 — Courses/Enrollment/Sessions
  'Course',
  'SyllabusDay',
  'CourseSession',
  'Enrollment',
  'AttendanceRecord',
  'VideoProgress',
  'Assessment',
  'Certificate',
  // Phase 3 — Citadel
  'Cohort',
  'Team',
  'TeamMember',
  'ProblemStatement',
  'ProblemStatementDeliverable',
  'Sprint',
  'SprintTask',
  'MilestoneSubmission',
  'MilestoneFeedback',
  'InvestorAccessGrant',
  'Bookmark',
  'InterestExpression',
  // Phase 4 — Scoring
  'ScoreEvent',
];

async function resetPostgres() {
  const url = process.env.DATABASE_URL;
  if (!url || !url.includes('forgeloom_test')) {
    throw new Error(
      `Refusing to run tests: DATABASE_URL does not point at forgeloom_test (got: ${url})`
    );
  }

  const prisma = new PrismaClient();
  const tableList = MIGRATED_TABLES.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
  await prisma.$disconnect();
}
