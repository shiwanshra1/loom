import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectPrisma } from './config/prisma.js';
import { ensureBucketExists } from './config/s3.js';
import { startCitadelWorker } from './jobs/citadelWorker.js';
import { startScoreWorker } from './jobs/scoreWorker.js';

async function main(): Promise<void> {
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
