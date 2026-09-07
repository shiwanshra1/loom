import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';
import { connectPrisma } from './config/prisma.js';
import { ensureBucketExists } from './config/s3.js';
import { startCitadelWorker } from './jobs/citadelWorker.js';
import { startScoreWorker } from './jobs/scoreWorker.js';

async function main(): Promise<void> {
  // Both stay connected through the migration window — connectDb() (Mongo)
  // serves every module not yet ported to Prisma; connectPrisma() (Postgres)
  // serves the modules that have been. See docs/prisma-migration-tickets.md.
  await connectDb();
  await connectPrisma();
  await ensureBucketExists();

  // Both run in-process alongside the API for now — fine at this scale;
  // splitting workers into their own process is a scaling concern for later.
  startCitadelWorker();
  startScoreWorker();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Forge Loom API listening on port ${env.port}`);
  });
}

main().catch((error: unknown) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
