import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { startCitadelWorker } from './jobs/citadelWorker.js';

async function main(): Promise<void> {
  await connectDb();

  // Runs in-process alongside the API for now — fine at this scale; splitting
  // workers into their own process is a scaling concern for later, not
  // something Phase 7 needs to solve.
  startCitadelWorker();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Forge Loom API listening on port ${env.port}`);
  });
}

main().catch((error: unknown) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
