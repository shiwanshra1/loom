import { PrismaClient } from '@prisma/client';

// Runs once before the whole suite, in a separate process from the test
// files themselves (vitest's globalSetup contract) — truncates every table
// in the dedicated forgeloom_test database so every run starts from a clean
// slate instead of accumulating fixture data across runs. Never touches the
// real dev database (a different name, set in apps/server/.env.test).
//
// The Mongo reset step this used to have was removed outright in Phase 7 of
// the Prisma migration (Mongo/Mongoose were fully retired in Phase 9). The
// hardcoded per-phase table list is gone too, replaced with a generic
// enumeration so this file never needs editing again as future phases land.
export default async function setup() {
  process.env.NODE_ENV = 'test';
  const { config } = await import('dotenv');
  const path = await import('node:path');
  config({ path: path.resolve(process.cwd(), '.env.test') });

  await resetPostgres();
}

async function resetPostgres() {
  const url = process.env.DATABASE_URL;
  if (!url || !url.includes('forgeloom_test')) {
    throw new Error(
      `Refusing to run tests: DATABASE_URL does not point at forgeloom_test (got: ${url})`
    );
  }

  const prisma = new PrismaClient();
  const tables = await prisma.$queryRaw<{ table_name: string }[]>`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name != '_prisma_migrations'
  `;
  if (tables.length > 0) {
    const tableList = tables.map((t) => `"${t.table_name}"`).join(', ');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
  }
  await prisma.$disconnect();
}
