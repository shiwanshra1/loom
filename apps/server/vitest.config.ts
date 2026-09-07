import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: { NODE_ENV: 'test' },
    // Real Postgres/bcrypt round-trips are slower than in-memory unit tests —
    // this suite is intentionally an integration suite against the local
    // Docker stack, not a mocked-DB unit suite.
    testTimeout: 15_000,
    hookTimeout: 20_000,
    fileParallelism: false,
    include: ['src/__tests__/**/*.test.ts'],
    globalSetup: ['src/__tests__/globalSetup.ts'],
    // All 5 test files share one Postgres database (`forgeloom_test`),
    // truncated once at suite start by globalSetup.ts — not per file. Running
    // them in a single process (rather than vitest's default
    // one-fork-per-file) is what keeps that shared, single-reset database
    // from racing across files. Per-test-file isolation (a transaction
    // rolled back after each file, or a truncate between files) would let
    // this run in parallel — a real but separable follow-up, out of scope
    // for the Prisma migration itself. This is no longer about Mongoose
    // connection teardown, which is what this comment used to say before
    // Phase 7 removed Mongo from the test harness entirely.
    pool: 'forks',
    singleFork: true,
  },
});
