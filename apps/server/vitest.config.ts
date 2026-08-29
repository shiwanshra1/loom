import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: { NODE_ENV: 'test' },
    // Real Mongo/bcrypt round-trips are slower than in-memory unit tests —
    // this suite is intentionally an integration suite against the local
    // Docker stack, not a mocked-DB unit suite (see src/__tests__/README.md).
    testTimeout: 15_000,
    hookTimeout: 20_000,
    fileParallelism: false,
    include: ['src/__tests__/**/*.test.ts'],
    globalSetup: ['src/__tests__/globalSetup.ts'],
    // Every test file connects/disconnects the same global Mongoose
    // connection and shares one Redis instance — running them in a single
    // process (rather than vitest's default one-fork-per-file) avoids
    // connection-teardown races between forks.
    pool: 'forks',
    singleFork: true,
  },
});
